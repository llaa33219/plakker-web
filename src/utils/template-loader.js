// 템플릿 파일을 읽고 변수를 치환하는 유틸리티
const templates = {};

// 기본 템플릿 로드 (실제로는 파일에서 읽어와야 하지만, Workers에서는 번들링됨)
export function loadTemplate(name, content) {
    templates[name] = content;
}

// 템플릿 렌더링
export function renderTemplate(templateName, variables = {}) {
    let template = templates[templateName];
    if (!template) {
        throw new Error(`Template '${templateName}' not found`);
    }
    
    // 변수 치환
    Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        template = template.replace(regex, value || '');
    });
    
    return template;
}

// 페이지 렌더링 (base 템플릿과 내용을 합침)
export function renderPage(title, content) {
    return renderTemplate('base', { title, content });
} 