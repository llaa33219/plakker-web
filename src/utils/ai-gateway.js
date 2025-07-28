// AI Gateway 관련 유틸리티 함수들

export async function validateImageWithGemini(imageBuffer, fileName, env) {
    try {
        const base64Image = arrayBufferToBase64(imageBuffer);
        
        const payload = {
            contents: [{
                parts: [
                    {
                        text: `이 이미지가 이모티콘/스티커로 사용하기에 적절한가요? 
                        
다음 기준으로 판단해주세요:
1. 적절함: 일반적인 이모티콘, 캐릭터, 동물, 음식, 물건, 자연, 감정 표현 등
2. 부적절함: 성인 콘텐츠, 폭력적 내용, 혐오 표현, 개인정보, 저작권 침해 소지

응답은 반드시 다음 JSON 형식으로만 해주세요:
{
  "appropriate": true/false,
  "reason": "판단 근거를 한국어로 간단히"
}`
                    },
                    {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: base64Image
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.1,
                topK: 32,
                topP: 1,
                maxOutputTokens: 200,
            }
        };
        
        const response = await fetch(`${env.AI_GATEWAY_BASE_URL}/v1beta/models/gemini-1.5-flash:generateContent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            console.error('AI Gateway 응답 오류:', response.status, await response.text());
            return { success: false, error: 'AI 검증 서비스 오류' };
        }
        
        const data = await response.json();
        
        if (!data.candidates || data.candidates.length === 0) {
            console.error('AI 응답에 candidates가 없음:', data);
            return { success: false, error: 'AI 응답 형식 오류' };
        }
        
        const content = data.candidates[0].content?.parts[0]?.text;
        if (!content) {
            console.error('AI 응답에 텍스트 내용이 없음:', data);
            return { success: false, error: 'AI 응답 내용 없음' };
        }
        
        try {
            // JSON 응답 파싱 시도
            const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
            const result = JSON.parse(cleanContent);
            
            return {
                success: true,
                appropriate: result.appropriate,
                reason: result.reason || '검증 완료',
                fileName: fileName
            };
        } catch (parseError) {
            console.error('AI 응답 JSON 파싱 실패:', parseError, 'Content:', content);
            // JSON 파싱에 실패하면 텍스트에서 정보 추출 시도
            const isAppropriate = content.toLowerCase().includes('true') || 
                                 content.includes('적절') || 
                                 !content.includes('부적절');
            return {
                success: true,
                appropriate: isAppropriate,
                reason: isAppropriate ? '검증 통과' : '부적절한 내용 감지',
                fileName: fileName
            };
        }
        
    } catch (error) {
        console.error('이미지 검증 중 오류:', error);
        return {
            success: false,
            error: '검증 중 오류 발생: ' + error.message,
            fileName: fileName
        };
    }
}

export function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
} 