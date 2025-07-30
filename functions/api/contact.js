import { handleAPI } from '../../src/api.js';

export async function onRequest(context) {
    const { request, env } = context;
    return await handleContactSubmission(request, env);
}

// 문의하기 처리
async function handleContactSubmission(request, env) {
    try {
        const formData = await request.json();
        const { name, email, subject, message } = formData;
        
        // 입력 유효성 검사
        if (!name || !email || !subject || !message) {
            return new Response(JSON.stringify({ 
                error: '모든 필드를 입력해주세요.' 
            }), { 
                status: 400, 
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 이메일 유효성 검사
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            return new Response(JSON.stringify({ 
                error: '올바른 이메일 주소를 입력해주세요.' 
            }), { 
                status: 400, 
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 텍스트 입력 정리 (기본적인 정리만)
        const cleanName = name.trim().substring(0, 100);
        const cleanEmail = email.trim().substring(0, 200);
        const cleanSubject = subject.trim().substring(0, 200);
        const cleanMessage = message.trim().substring(0, 2000);
        
        // 현재 시간
        const now = new Date();
        const timestamp = now.toISOString();
        
        // 이메일 내용 생성 (HTML 이스케이핑)
        const escapeHtml = (text) => {
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        };
        
        // MailChannels를 통한 이메일 전송
        const emailData = {
            personalizations: [
                {
                    to: [{ 
                        email: 'lukeehfkdpahd1@gmail.com', 
                        name: 'Plakker 문의' 
                    }]
                }
            ],
            from: {
                email: 'noreply@plakker.bloupla.net',
                name: 'Plakker 문의 시스템'
            },
            subject: '[Plakker 문의] ' + cleanSubject,
            content: [
                {
                    type: 'text/html',
                    value: [
                        '<h2>새로운 문의가 접수되었습니다</h2>',
                        '<hr>',
                        '<p><strong>보낸 사람:</strong> ' + cleanName + '</p>',
                        '<p><strong>이메일:</strong> ' + cleanEmail + '</p>',
                        '<p><strong>제목:</strong> ' + cleanSubject + '</p>',
                        '<p><strong>접수 시간:</strong> ' + timestamp + '</p>',
                        '<hr>',
                        '<h3>문의 내용:</h3>',
                        '<div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;">' + cleanMessage + '</div>',
                        '<hr>',
                        '<p style="color: #666; font-size: 12px;">',
                        '이 메일은 Plakker 문의 시스템에서 자동으로 발송되었습니다.<br>',
                        '답변은 위 이메일 주소(' + cleanEmail + ')로 직접 보내주세요.',
                        '</p>'
                    ].join('')
                }
            ]
        };
        
        // MailChannels API 호출
        const mailResponse = await fetch('https://api.mailchannels.net/tx/v1/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });
        
        if (!mailResponse.ok) {
            const errorText = await mailResponse.text();
            console.error('MailChannels 오류:', mailResponse.status, errorText);
            return new Response(JSON.stringify({ 
                error: '이메일 전송에 실패했습니다. 나중에 다시 시도해주세요.' 
            }), { 
                status: 500, 
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return new Response(JSON.stringify({ 
            success: true,
            message: '문의가 성공적으로 전송되었습니다.'
        }), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('문의 처리 오류:', error);
        return new Response(JSON.stringify({ 
            error: '서버 오류가 발생했습니다.' 
        }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 