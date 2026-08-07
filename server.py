import http.server
import socketserver
import urllib.request
import urllib.parse
import json
import re
import os

PORT = int(os.environ.get("PORT", 8080))

class RAGRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Перевіряємо чи це запит до нашого кастомного API
        if self.path.startswith('/api/search?q='):
            try:
                # Дістаємо текст запиту
                query = urllib.parse.unquote(self.path.split('q=')[1])
                print(f"[RAG] Шукаю в інтернеті: {query}")
                
                # Формуємо запит до HTML-версії DuckDuckGo
                search_query = query + " українською"
                url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote(search_query)
                req = urllib.request.Request(
                    url, 
                    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
                )
                
                try:
                    html = urllib.request.urlopen(req, timeout=5).read().decode('utf-8')
                    # Простий парсинг результатів пошуку
                    snippets = re.findall(r'<a class="result__snippet[^>]*>(.*?)</a>', html, re.IGNORECASE | re.DOTALL)
                    clean_snippets = [re.sub(r'<[^>]+>', '', s).strip() for s in snippets][:5]
                except Exception as e:
                    print(f"[RAG] DuckDuckGo не відповів ({e}), використовую Wikipedia Fallback...")
                    # Fallback to Wikipedia API
                    wiki_url = "https://uk.wikipedia.org/w/api.php?action=query&list=search&srsearch=" + urllib.parse.quote(query) + "&utf8=&format=json"
                    wiki_req = urllib.request.Request(wiki_url, headers={'User-Agent': 'TextGenHub/1.0'})
                    wiki_data = json.loads(urllib.request.urlopen(wiki_req, timeout=5).read().decode('utf-8'))
                    clean_snippets = [re.sub(r'<[^>]+>', '', res['snippet']).strip() for res in wiki_data.get('query', {}).get('search', [])[:3]]
                # Відправляємо результати назад в браузер
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                # Дозволяємо CORS на всякий випадок
                self.send_header('Access-Control-Allow-Origin', '*') 
                self.end_headers()
                
                response_data = json.dumps({'success': True, 'results': clean_snippets})
                self.wfile.write(response_data.encode('utf-8'))
                return
                
            except Exception as e:
                print(f"[RAG Error] Помилка пошуку: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode('utf-8'))
                return
                
        # Якщо це звичайний файл (index.html, script.js) - віддаємо його як звичайний сервер
        return super().do_GET()

    def end_headers(self):
        # Вимикаємо кешування браузером для зручної розробки
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

# Змінюємо робочу директорію на ту, де лежить скрипт, щоб файли роздавалися правильно
os.chdir(os.path.dirname(os.path.abspath(__file__)))

socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer(("", PORT), RAGRequestHandler) as httpd:
    print(f"=====================================================")
    print(f"🚀 TextGenHub Server запущено!")
    print(f"🔗 Відкрийте в браузері: http://localhost:{PORT}/app/index.html")
    print(f"=====================================================")
    print(f"Сервер підтримує RAG (Пошук в інтернеті). Чекаю запитів...\n")
    httpd.serve_forever()
