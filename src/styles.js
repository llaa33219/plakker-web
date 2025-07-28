// CSS 스타일
export const CSS_STYLES = `
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    background-color: #f8f9fa;
    color: #333;
}

/* 기본 버튼 스타일 - 사용자 요청 디자인 */
button {
    background-color: #007BFF;
    color: white;
    border: none;
    border-radius: 20px;
    padding: 15px 30px;
    margin: 20px 0;
    max-width: 600px;
    min-height: 61px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.1s ease, box-shadow 0.3s ease;
    font-weight: bold;
    font-size: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
}

button:hover {
    background-color: #005BDD;
    transform: translateY(2px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

button:active {
    background-color: #0026a3;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

button:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header {
    background: white;
    padding: 1rem;
    border-bottom: 1px solid #e9ecef;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
}

.header-content {
    display: flex;
    align-items: center;
    font-size: 30px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.header-content img {
    margin-right: 20px;
    border-radius: 14px;
}

.header nav a {
    text-decoration: none;
    color: #6c757d;
    transition: color 0.2s;
    font-size: 1.2rem;
    font-weight: 500;
}

.header nav a:hover {
    color: #007bff;
}

.header nav {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    justify-content: center;
    gap: 2rem;
}

.header nav a.hidden-nav {
    display: none;
}

.main {
    min-height: calc(100vh - 70px);
    padding: 2rem 0;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

.pack-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 2rem 0;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
}

.pack-item {
    background: white;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    display: flex;
    align-items: center;
    gap: 1rem;
}

.pack-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.pack-thumbnail {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 8px;
    flex-shrink: 0;
}

.pack-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.pack-title {
    font-size: 1.2rem;
    font-weight: bold;
    color: #333;
}

.pack-creator {
    color: #6c757d;
    font-size: 1rem;
}

.upload-warning {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.ai-validation-notice {
    background: #e8f4fd;
    color: #0c5460;
    border: 1px solid #bee5eb;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 2rem;
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: 0.95rem;
    line-height: 1.5;
}

.warning-icon, .info-icon {
    display: none;
}

.upload-form {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    max-width: 700px;
    margin: 0 auto;
}

.form-group {
    margin-bottom: 2rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.75rem;
    font-weight: 600;
    color: #2d3748;
    font-size: 1.1rem;
}

.form-group input[type="text"],
.form-group input[type="url"] {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
}

.file-upload-area {
    border: 2px dashed #cbd5e0;
    border-radius: 8px;
    padding: 1.5rem;
    text-align: center;
    background: #f7fafc;
    transition: border-color 0.2s, background-color 0.2s;
}

.file-upload-area:hover {
    border-color: #007bff;
    background: #f0f8ff;
}

/* 파일 업로드 버튼 - 조금 작게 */
.add-file-btn {
    font-size: 1rem;
    padding: 12px 24px;
    min-height: 48px;
    width: auto;
    max-width: 300px;
    margin: 10px auto;
    display: flex;
    gap: 0.5rem;
}

.plus-icon {
    font-size: 1.2rem;
    font-weight: bold;
}

.form-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #e2e8f0;
}

/* 폼 액션 버튼들 */
.reset-btn {
    background: #6c757d;
    width: auto;
    max-width: 200px;
    padding: 12px 24px;
    font-size: 1rem;
    min-height: 48px;
}

.reset-btn:hover {
    background: #5a6268;
}

.submit-btn {
    background: #28a745;
    width: auto;
    max-width: 300px;
    padding: 12px 24px;
    font-size: 1.1rem;
    min-height: 48px;
    position: relative;
    min-width: 120px;
}

.submit-btn:hover:not(:disabled) {
    background: #218838;
}

.submit-loading {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
}

.file-info {
    font-size: 0.875rem;
    color: #6c757d;
    margin-top: 0.25rem;
}

.file-preview {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
    padding: 1.5rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    background-color: #f8fafc;
    min-height: 120px;
}

.file-preview.has-files {
    border-color: #007bff;
    background-color: #f0f8ff;
}

.file-preview:empty::after {
    content: "선택된 파일이 없습니다";
    grid-column: 1 / -1;
    text-align: center;
    color: #a0aec0;
    font-style: italic;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 80px;
}

.preview-item {
    position: relative;
    text-align: center;
    background: white;
    border-radius: 8px;
    padding: 0.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: transform 0.2s, box-shadow 0.2s;
}

.preview-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.preview-image {
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 6px;
    border: 2px solid #e2e8f0;
}

.preview-filename {
    font-size: 0.75rem;
    color: #4a5568;
    margin-top: 0.5rem;
    word-break: break-all;
    line-height: 1.2;
    font-weight: 500;
}

/* 제거 버튼 - 빨간색으로 유지 */
.preview-remove {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #e53e3e;
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    transition: background-color 0.2s, transform 0.1s;
    margin: 0;
    padding: 0;
    min-height: 24px;
}

.preview-remove:hover {
    background: #c53030;
    transform: scale(1.1);
}

.preview-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100px;
    color: #6c757d;
    font-size: 0.875rem;
}

.pack-detail {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.pack-detail h2 {
    font-size: 2.2rem;
    font-weight: bold;
    color: #333;
    text-align: center;
    margin-bottom: 1rem;
}

.pack-info {
    margin: 1rem 0 2rem 0;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e9ecef;
}

.emoticons-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1.5rem;
    margin: 2rem 0;
}

.emoticon-item img {
    width: 100%;
    height: 180px;
    object-fit: contain;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    background-color: #f8f9fa;
}

.pack-actions {
    margin-top: 2rem;
    text-align: center;
}



/* 페이지네이션 버튼들 - 작게 유지 */
.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin: 2rem 0;
}

.pagination button {
    padding: 8px 16px;
    font-size: 0.9rem;
    border-radius: 12px;
    min-height: 40px;
    width: auto;
    max-width: 120px;
    margin: 5px;
}

.pagination button:disabled {
    background: #6c757d;
    cursor: not-allowed;
}

.loading {
    text-align: center;
    padding: 2rem;
    color: #6c757d;
}

.error {
    background: #f8d7da;
    color: #721c24;
    padding: 1rem;
    border-radius: 4px;
    margin: 1rem 0;
}

.success {
    background: #d4edda;
    color: #155724;
    padding: 1rem;
    border-radius: 4px;
    margin: 1rem 0;
}

@media (max-width: 768px) {
    .container {
        padding: 0 0.5rem;
    }
    
    .pack-grid {
        max-width: 100%;
        margin: 1rem 0;
    }
    
    .pack-item {
        padding: 0.75rem;
        gap: 0.75rem;
    }
    
    .pack-thumbnail {
        width: 60px;
        height: 60px;
    }
    
    .pack-title {
        font-size: 1rem;
    }
    
    .pack-creator {
        font-size: 0.9rem;
    }
    
    .emoticons-grid {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 1rem;
    }
    
    .emoticon-item img {
        height: 140px;
    }
    
    .pack-detail h2 {
        font-size: 1.8rem;
    }
    
    .header {
        flex-direction: column;
        gap: 1rem;
    }
    
    /* 모바일에서 버튼 크기 조정 */
    button {
        max-width: 100%;
        font-size: 14px;
        padding: 12px 20px;
        margin: 10px 0;
    }
    
    .form-actions {
        flex-direction: column;
        align-items: center;
    }
    
    .form-actions button {
        width: 100%;
        max-width: 300px;
    }
}

/* API 문서 스타일 */
.api-docs {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    max-width: none;
}

.api-intro {
    font-size: 1.1rem;
    color: #6c757d;
    margin-bottom: 2rem;
    line-height: 1.6;
}

.api-section {
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid #e9ecef;
}

.api-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
}

.api-section h3 {
    color: #007bff;
    font-size: 1.5rem;
    margin-bottom: 1rem;
}

.api-section h4 {
    color: #495057;
    font-size: 1.1rem;
    margin: 1.5rem 0 0.5rem 0;
}

.api-info {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 4px;
    border-left: 4px solid #007bff;
}

.endpoint {
    margin-bottom: 2rem;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    overflow: hidden;
}

@media (max-width: 768px) {
    .container {
        padding: 0 0.5rem;
    }
    
    .emoticons-grid {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 1rem;
    }
    
    .emoticon-item img {
        height: 140px;
    }
    
    .pack-detail h2 {
        font-size: 1.8rem;
    }
    
    .header {
        flex-direction: column;
        gap: 1rem;
    }
    
    .api-docs {
        padding: 1rem;
    }
    
    .endpoint-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
    
    .param-table {
        font-size: 0.875rem;
    }
    
    .param-table th,
    .param-table td {
        padding: 0.5rem;
    }
    
    .code-block {
        font-size: 0.75rem;
        padding: 1rem;
    }
    
    .modal-content {
        margin: 20px;
        width: calc(100% - 40px);
    }
    
    .modal-footer {
        flex-direction: column;
    }
    
    .modal-footer .btn {
        width: 100%;
        justify-content: center;
    }
}

.endpoint-header {
    background: #f8f9fa;
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    border-bottom: 1px solid #e9ecef;
}

.method {
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-weight: bold;
    font-size: 0.875rem;
    text-transform: uppercase;
}

.method.get {
    background: #28a745;
    color: white;
}

.method.post {
    background: #007bff;
    color: white;
}

.path {
    font-family: 'Courier New', monospace;
    font-size: 1.1rem;
    font-weight: bold;
    color: #495057;
}

.endpoint-content {
    padding: 1.5rem;
}

.description {
    color: #6c757d;
    margin-bottom: 1rem;
    line-height: 1.6;
}

.param-table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    background: white;
}

.param-table th,
.param-table td {
    padding: 0.75rem;
    text-align: left;
    border: 1px solid #e9ecef;
}

.param-table th {
    background: #f8f9fa;
    font-weight: 600;
    color: #495057;
}

.param-table code {
    background: #f8f9fa;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    color: #e83e8c;
    border: 1px solid #e9ecef;
}

.code-block {
    background: #2d3748;
    color: #e2e8f0;
    padding: 1.5rem;
    border-radius: 4px;
    overflow-x: auto;
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    line-height: 1.6;
    margin: 1rem 0;
    border: 1px solid #4a5568;
}

.api-section ul {
    margin-left: 1.5rem;
}

.api-section li {
    margin-bottom: 0.5rem;
    line-height: 1.6;
}

@media (max-width: 768px) {
    .api-docs {
        padding: 1rem;
    }
    
    .endpoint-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
    
    .param-table {
        font-size: 0.875rem;
    }
    
    .param-table th,
    .param-table td {
        padding: 0.5rem;
    }
    
    .code-block {
        font-size: 0.75rem;
        padding: 1rem;
    }
}

/* 업로드 결과 모달 스타일 */
.upload-result-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
    z-index: 1;
}

.modal-content {
    position: relative;
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    animation: modalSlideIn 0.3s ease-out;
    z-index: 2;
}

@keyframes modalSlideIn {
    from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.modal-header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid #e9ecef;
    display: flex;
    align-items: center;
    gap: 12px;
}

.modal-header.success {
    background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
    color: #155724;
}

.modal-header.error {
    background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
    color: #721c24;
}

.modal-icon {
    display: none;
}

.modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
}

.modal-body {
    padding: 20px 24px;
}

.main-message {
    font-size: 1rem;
    margin: 0 0 20px 0;
    line-height: 1.5;
}

.validation-summary {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 16px;
    margin-top: 16px;
}

.validation-summary h4 {
    margin: 0 0 12px 0;
    color: #333;
    font-size: 1rem;
}

.validation-stats {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
}

.stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: white;
    border-radius: 6px;
    border: 1px solid #e9ecef;
}

.stat-label {
    font-weight: 500;
    color: #555;
}

.stat-value {
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 4px;
    background: #e9ecef;
    color: #333;
}

.stat-value.success {
    background: #d4edda;
    color: #155724;
}

.stat-value.error {
    background: #f8d7da;
    color: #721c24;
}

.rejected-details {
    border-top: 1px solid #e9ecef;
    padding-top: 12px;
}

.rejected-details h5 {
    margin: 0 0 8px 0;
    color: #721c24;
    font-size: 0.9rem;
}

.rejected-list {
    margin: 0;
    padding-left: 20px;
    list-style-type: disc;
}

.rejected-list li {
    margin: 4px 0;
    font-size: 0.9rem;
    line-height: 1.4;
}

.modal-footer {
    padding: 16px 24px 20px;
    border-top: 1px solid #e9ecef;
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}

.modal-footer .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 16px;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
}

.modal-footer .btn-primary {
    background: #007bff;
    color: white;
}

.modal-footer .btn-primary:hover {
    background: #0056b3;
}

.modal-footer .btn-secondary {
    background: #6c757d;
    color: white;
}

.modal-footer .btn-secondary:hover {
    background: #545b62;
}

@media (max-width: 600px) {
    .modal-content {
        margin: 20px;
        width: calc(100% - 40px);
    }
    
    .modal-footer {
        flex-direction: column;
    }
    
    .modal-footer .btn {
        width: 100%;
        justify-content: center;
    }
}
`; 