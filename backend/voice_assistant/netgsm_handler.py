"""
Netgsm Voice API Handler
Handles incoming voice calls from Netgsm virtual numbers
"""
import os
import json
import requests
from django.conf import settings
from .openai_handler import OpenAIHandler

class NetgsmVoiceHandler:
    """Handles Netgsm voice API requests"""
    
    def __init__(self):
        self.api_key = os.getenv('NETGSM_API_KEY')
        self.api_secret = os.getenv('NETGSM_API_SECRET')
        self.phone_number = os.getenv('NETGSM_PHONE_NUMBER')
        self.base_url = 'https://api.netgsm.com.tr/voice/v1'
        
        # Initialize OpenAI handler
        self.openai_handler = OpenAIHandler()
        
    def handle_incoming_call(self, call_data):
        """
        Handle incoming call from Netgsm
        
        Args:
            call_data (dict): Call data from Netgsm webhook
                - caller_number: Caller's phone number
                - called_number: Called number (our virtual number)
                - call_id: Unique call identifier
                - timestamp: Call timestamp
        
        Returns:
            dict: Response to send back to Netgsm
        """
        caller_number = call_data.get('caller_number', 'Unknown')
        call_id = call_data.get('call_id', 'Unknown')
        
        print(f"[Netgsm] Incoming call from {caller_number}, call_id: {call_id}")
        
        # Welcome message
        welcome_message = (
            "Merhaba! HSD İnönü Topluluğu yapay zeka asistanına hoş geldiniz. "
            "Etkinlikler, görevler, projeler veya komiteler hakkında soru sorabilirsiniz. "
            "Örneğin: İlk etkinlik ne zaman? Yaklaşan etkinlikler neler?"
        )
        
        # Return IVR response
        return {
            'action': 'speak',
            'text': welcome_message,
            'language': 'tr-TR',
            'voice': 'female',  # or 'male'
            'next_action': 'listen',  # Wait for user speech
            'listen_timeout': 10,  # seconds
            'webhook_url': f"{settings.BASE_URL}/api/v1/voice/process-speech/"
        }
    
    def process_user_speech(self, speech_data):
        """
        Process user speech after listening
        
        Args:
            speech_data (dict): Speech recognition data from Netgsm
                - call_id: Call identifier
                - speech_text: Recognized speech text
                - confidence: Recognition confidence (0-1)
        
        Returns:
            dict: Response with assistant's answer
        """
        call_id = speech_data.get('call_id', 'Unknown')
        user_question = speech_data.get('speech_text', '').strip()
        confidence = speech_data.get('confidence', 0.0)
        
        print(f"[Netgsm] User question: {user_question} (confidence: {confidence})")
        
        if not user_question:
            return {
                'action': 'speak',
                'text': 'Sizi duymadım. Lütfen sorunuzu tekrar söyler misiniz?',
                'language': 'tr-TR',
                'voice': 'female',
                'next_action': 'listen',
                'listen_timeout': 10,
                'webhook_url': f"{settings.BASE_URL}/api/v1/voice/process-speech/"
            }
        
        # Check if question is about HSD
        is_valid, rejection_message = self.openai_handler.is_question_about_hsd(user_question)
        
        if not is_valid:
            return {
                'action': 'speak',
                'text': rejection_message,
                'language': 'tr-TR',
                'voice': 'female',
                'next_action': 'hangup'  # End call after rejection
            }
        
        # Get response from OpenAI GPT-4o-mini
        try:
            assistant_response = self.openai_handler.get_ai_response(user_question, call_id)
            
            # Check for call termination keywords
            termination_keywords = ['kapat', 'bitir', 'teşekkürler', 'görüşürüz']
            if any(keyword in user_question.lower() for keyword in termination_keywords):
                return {
                    'action': 'speak',
                    'text': 'Görüşmek üzere! İyi günler.',
                    'language': 'tr-TR',
                    'voice': 'female',
                    'next_action': 'hangup'
                }
            
            # Continue conversation
            return {
                'action': 'speak',
                'text': assistant_response,
                'language': 'tr-TR',
                'voice': 'female',
                'next_action': 'listen',
                'listen_timeout': 10,
                'webhook_url': f"{settings.BASE_URL}/api/v1/voice/process-speech/"
            }
            
        except Exception as e:
            print(f"[Netgsm] Error processing speech: {str(e)}")
            return {
                'action': 'speak',
                'text': 'Üzgünüm, bir hata oluştu. Lütfen daha sonra tekrar arayın.',
                'language': 'tr-TR',
                'voice': 'female',
                'next_action': 'hangup'
            }
    
    def send_tts(self, call_id, text):
        """
        Send Text-to-Speech to ongoing call
        
        Args:
            call_id (str): Call identifier
            text (str): Text to speak
        
        Returns:
            bool: Success status
        """
        url = f"{self.base_url}/tts"
        
        payload = {
            'api_key': self.api_key,
            'api_secret': self.api_secret,
            'call_id': call_id,
            'text': text,
            'language': 'tr-TR',
            'voice': 'female'
        }
        
        try:
            response = requests.post(url, json=payload, timeout=10)
            response.raise_for_status()
            
            result = response.json()
            return result.get('success', False)
            
        except requests.exceptions.RequestException as e:
            print(f"[Netgsm] Error sending TTS: {str(e)}")
            return False
    
    def hangup_call(self, call_id):
        """
        Hangup an ongoing call
        
        Args:
            call_id (str): Call identifier
        
        Returns:
            bool: Success status
        """
        url = f"{self.base_url}/hangup"
        
        payload = {
            'api_key': self.api_key,
            'api_secret': self.api_secret,
            'call_id': call_id
        }
        
        try:
            response = requests.post(url, json=payload, timeout=10)
            response.raise_for_status()
            
            result = response.json()
            return result.get('success', False)
            
        except requests.exceptions.RequestException as e:
            print(f"[Netgsm] Error hanging up call: {str(e)}")
            return False
