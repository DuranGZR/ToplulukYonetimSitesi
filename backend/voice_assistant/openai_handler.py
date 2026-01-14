"""
OpenAI Handler (Whisper + GPT-4o-mini)
Handles speech-to-text and AI response generation using OpenAI APIs
"""
import os
from openai import OpenAI
from .function_handlers import (
    get_events,
    get_tasks,
    get_projects,
    get_committees,
    get_user_info,
    get_leaderboard
)

class OpenAIHandler:
    """Handles OpenAI Whisper (STT) and GPT-4o-mini (AI) requests"""
    
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        self.client = OpenAI(api_key=self.api_key)
        self.model = "gpt-4o-mini"  # Ucuz ve hızlı model
        
        # System instruction - HSD topluluğu için özel
        self.system_instruction = """Sen HSD İnönü Topluluğu'nun yapay zeka asistanısın.

Görevin:
- Sadece HSD topluluğu hakkında bilgi vermek (etkinlikler, görevler, projeler, komiteler, üyeler, puan sistemi)
- Site dışı sorulara "Üzgünüm, ben sadece HSD İnönü Topluluğu hakkında bilgi verebilirim." diye cevap ver
- Kısa ve net cevaplar ver (telefon konuşması için uygun)
- Türkçe konuş
- Samimi ve yardımsever ol

Örnekler:
✅ "İlk etkinlik ne zaman?" → Cevapla
✅ "Yaklaşan görevler neler?" → Cevapla
✅ "Komiteler neler?" → Cevapla
❌ "Python nedir?" → Reddet
❌ "Hava durumu nasıl?" → Reddet
❌ "Yemek tarifi ver" → Reddet

Önemli:
- Kullanıcı "kapat", "bitir", "teşekkürler", "görüşürüz" derse, "Görüşmek üzere! İyi günler." de ve aramayı bitir.
- Cevapların 2-3 cümleden uzun olmasın (telefonda dinlemek zor olur).
"""

        # Function definitions for database queries
        self.functions = [
            {
                "name": "get_events",
                "description": "Etkinlikleri sorgula. Yaklaşan etkinlikler, geçmiş etkinlikler veya belirli bir etkinlik hakkında bilgi al.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Aranacak etkinlik adı veya 'upcoming' (yaklaşan) ya da 'past' (geçmiş)"
                        },
                        "user_id": {
                            "type": "integer",
                            "description": "Kullanıcı ID (opsiyonel)"
                        }
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "get_tasks",
                "description": "Görevleri sorgula. Tamamlanmamış görevler, kullanıcıya atanmış görevler veya belirli bir görev hakkında bilgi al.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Aranacak görev adı veya 'available' (müsait), 'my_tasks' (benim görevlerim)"
                        },
                        "user_id": {
                            "type": "integer",
                            "description": "Kullanıcı ID (opsiyonel)"
                        }
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "get_projects",
                "description": "Projeleri sorgula. Aktif projeler, tamamlanmış projeler veya belirli bir proje hakkında bilgi al.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Aranacak proje adı veya 'active' (aktif), 'completed' (tamamlanmış)"
                        },
                        "user_id": {
                            "type": "integer",
                            "description": "Kullanıcı ID (opsiyonel)"
                        }
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "get_committees",
                "description": "Komiteleri sorgula. Tüm komiteler veya belirli bir komite hakkında bilgi al.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Aranacak komite adı veya 'all' (tümü)"
                        }
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "get_user_info",
                "description": "Kullanıcı bilgilerini sorgula. İsim, puan, level, komite gibi bilgileri al.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "username": {
                            "type": "string",
                            "description": "Kullanıcı adı veya isim"
                        }
                    },
                    "required": ["username"]
                }
            },
            {
                "name": "get_leaderboard",
                "description": "Puan tablosunu sorgula. En yüksek puanlı kullanıcıları listele.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "limit": {
                            "type": "integer",
                            "description": "Kaç kullanıcı gösterilsin (varsayılan: 10)",
                            "default": 10
                        }
                    }
                }
            }
        ]

    def get_ai_response(self, user_message, call_id="unknown"):
        """
        Get AI response using GPT-4o-mini with function calling
        
        Args:
            user_message (str): User's question
            call_id (str): Call identifier for logging
        
        Returns:
            str: AI response
        """
        try:
            print(f"[OpenAI] Call {call_id}: User message: {user_message}")
            
            # Call GPT-4o-mini with function calling
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_instruction},
                    {"role": "user", "content": user_message}
                ],
                functions=self.functions,
                function_call="auto",
                temperature=0.7,
                max_tokens=300  # Kısa cevaplar için (telefon konuşması)
            )
            
            message = response.choices[0].message
            
            # Check if function call is needed
            if message.function_call:
                function_name = message.function_call.name
                function_args = eval(message.function_call.arguments)
                
                print(f"[OpenAI] Function call: {function_name}({function_args})")
                
                # Call the appropriate function
                function_response = self._call_function(function_name, function_args)
                
                # Get final response from GPT-4o-mini with function result
                second_response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": self.system_instruction},
                        {"role": "user", "content": user_message},
                        {"role": "assistant", "content": None, "function_call": {
                            "name": function_name,
                            "arguments": message.function_call.arguments
                        }},
                        {"role": "function", "name": function_name, "content": function_response}
                    ],
                    temperature=0.7,
                    max_tokens=300
                )
                
                final_response = second_response.choices[0].message.content
                print(f"[OpenAI] Response: {final_response}")
                return final_response
            else:
                # Direct response without function call
                final_response = message.content
                print(f"[OpenAI] Direct response: {final_response}")
                return final_response
                
        except Exception as e:
            print(f"[OpenAI] Error: {str(e)}")
            return "Üzgünüm, bir hata oluştu. Lütfen sorunuzu tekrar sorar mısınız?"
    
    def _call_function(self, function_name, function_args):
        """
        Call the appropriate function handler
        
        Args:
            function_name (str): Function name
            function_args (dict): Function arguments
        
        Returns:
            str: Function result as JSON string
        """
        try:
            if function_name == "get_events":
                return get_events(function_args.get("query"), function_args.get("user_id"))
            elif function_name == "get_tasks":
                return get_tasks(function_args.get("query"), function_args.get("user_id"))
            elif function_name == "get_projects":
                return get_projects(function_args.get("query"), function_args.get("user_id"))
            elif function_name == "get_committees":
                return get_committees(function_args.get("query"))
            elif function_name == "get_user_info":
                return get_user_info(function_args.get("username"))
            elif function_name == "get_leaderboard":
                return get_leaderboard(function_args.get("limit", 10))
            else:
                return '{"error": "Unknown function"}'
        except Exception as e:
            print(f"[OpenAI] Function error: {str(e)}")
            return f'{{"error": "{str(e)}"}}'
    
    def is_question_about_hsd(self, question):
        """
        Validate if question is about HSD community
        
        Args:
            question (str): User's question
        
        Returns:
            tuple: (is_valid, rejection_message)
        """
        # HSD ile ilgili anahtar kelimeler
        hsd_keywords = [
            'etkinlik', 'event', 'görev', 'task', 'proje', 'project',
            'komite', 'committee', 'topluluk', 'community', 'hsd',
            'puan', 'point', 'level', 'üye', 'member', 'toplantı', 'meeting',
            'inönü', 'yaklaşan', 'upcoming', 'ne zaman', 'when', 'kim', 'who',
            'nasıl', 'how', 'nerede', 'where', 'kaç', 'how many'
        ]
        
        question_lower = question.lower()
        
        # Check if any HSD keyword exists
        if any(keyword in question_lower for keyword in hsd_keywords):
            return True, None
        
        # If no keyword found, reject
        rejection_message = (
            "Üzgünüm, ben sadece HSD İnönü Topluluğu hakkında bilgi verebilirim. "
            "Etkinlikler, görevler, projeler, komiteler veya puan sistemi hakkında "
            "soru sorabilirsiniz."
        )
        
        return False, rejection_message
