// JavaScript 클라이언트 코드 (템플릿 리터럴을 일반 문자열로 변경)
export const JS_CLIENT = `
let currentPage = 1;

document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    
    if (path === '/') {
        loadPackList(1);
        setupPagination();
    } else if (path === '/upload') {
        setupUploadForm();
        loadUploadLimitStatus();
    }
});

async function loadPackList(page = 1) {
    try {
        const response = await fetch('/api/packs?page=' + page);
        const data = await response.json();
        
        const container = document.getElementById('pack-list');
        if (data.packs && data.packs.length > 0) {
            container.innerHTML = '';
            data.packs.forEach(pack => {
                const packDiv = document.createElement('div');
                packDiv.className = 'pack-item';
                packDiv.style.cursor = 'pointer';
                packDiv.addEventListener('click', () => {
                    location.href = '/pack/' + pack.id;
                });
                
                const img = document.createElement('img');
                img.src = pack.thumbnail;
                img.alt = pack.title;
                img.className = 'pack-thumbnail';
                
                const info = document.createElement('div');
                info.className = 'pack-info';
                
                const title = document.createElement('div');
                title.className = 'pack-title';
                title.textContent = pack.title; // textContent는 HTML 태그를 자동으로 이스케이프함
                
                const creator = document.createElement('div');
                creator.className = 'pack-creator';
                creator.textContent = pack.creator; // textContent는 HTML 태그를 자동으로 이스케이프함
                
                info.appendChild(title);
                info.appendChild(creator);
                packDiv.appendChild(img);
                packDiv.appendChild(info);
                container.appendChild(packDiv);
            });
        } else {
            container.innerHTML = '<div class="loading">등록된 이모티콘 팩이 없습니다.</div>';
        }
        
        updatePagination(data.currentPage, data.hasNext);
        
    } catch (error) {
        console.error('팩 리스트 로드 실패:', error);
        document.getElementById('pack-list').innerHTML = '<div class="error">팩 리스트를 불러오는데 실패했습니다.</div>';
    }
}

function setupPagination() {
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadPackList(currentPage);
        }
    });
    
    document.getElementById('next-page').addEventListener('click', () => {
        currentPage++;
        loadPackList(currentPage);
    });
}

function updatePagination(page, hasNext) {
    currentPage = page;
    document.getElementById('page-info').textContent = page + '페이지';
    document.getElementById('prev-page').disabled = page <= 1;
    document.getElementById('next-page').disabled = !hasNext;
}

function setupUploadForm() {
    const form = document.getElementById('upload-form');
    const thumbnailInput = document.getElementById('thumbnail-input');
    const emoticonsInput = document.getElementById('emoticons-input');
    
    // 실시간 입력 검증 설정
    const titleInput = document.getElementById('title');
    const creatorInput = document.getElementById('creator');
    const creatorLinkInput = document.getElementById('creator-link');
    
    // 실시간 검증 함수
    function setupRealTimeValidation(input, fieldName, maxLength) {
        let timeoutId;
        input.addEventListener('input', function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const value = input.value.trim();
                if (value && /<[^>]*>/g.test(value)) {
                    input.style.borderColor = '#ff4444';
                    input.title = fieldName + '에는 HTML 태그를 포함할 수 없습니다.';
                } else if (value.length > maxLength) {
                    input.style.borderColor = '#ff4444';
                    input.title = fieldName + '은(는) ' + maxLength + '자를 초과할 수 없습니다.';
                } else {
                    input.style.borderColor = '';
                    input.title = '';
                }
            }, 300);
        });
    }
    
    // 각 입력 필드에 실시간 검증 적용
    if (titleInput) setupRealTimeValidation(titleInput, '제목', 50);
    if (creatorInput) setupRealTimeValidation(creatorInput, '제작자 이름', 30);
    if (creatorLinkInput) {
        creatorLinkInput.addEventListener('blur', function() {
            const value = this.value.trim();
            if (value && value.length > 0) {
                try {
                    let testUrl = value;
                    if (!testUrl.match(/^https?:\\/\\//i)) {
                        testUrl = 'https://' + testUrl;
                    }
                    new URL(testUrl);
                    this.style.borderColor = '';
                    this.title = '';
                } catch (error) {
                    this.style.borderColor = '#ff4444';
                    this.title = '유효한 URL 형식이 아닙니다.';
                }
            } else {
                this.style.borderColor = '';
                this.title = '';
            }
        });
    }
    
    let selectedThumbnail = null;
    let selectedEmoticons = [];
    
    // 허용된 이미지 형식
    const allowedImageTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp', 'image/gif'];
    
    // 파일 형식 검증 함수
    function isValidImageType(file) {
        return allowedImageTypes.includes(file.type.toLowerCase());
    }
    
    // 이미지 리사이즈 함수
    function resizeImage(file, maxWidth, maxHeight) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = function() {
                // 비율을 유지하면서 리사이즈
                let { width, height } = img;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // 이미지 그리기
                ctx.drawImage(img, 0, 0, width, height);
                
                // Blob으로 변환
                canvas.toBlob(resolve, file.type, 0.8);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }
    
    // 썸네일 파일 선택 이벤트
    thumbnailInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file) {
            if (!isValidImageType(file)) {
                alert('지원되는 이미지 형식만 선택해주세요. (PNG, JPG, JPEG, WebP, GIF)');
                e.target.value = '';
                return;
            }
            
            try {
                // 썸네일 리사이즈 (200x200)
                const resizedFile = await resizeImage(file, 200, 200);
                selectedThumbnail = new File([resizedFile], file.name, { 
                    type: file.type, 
                    lastModified: Date.now() 
                });
                updateThumbnailPreview();
            } catch (error) {
                console.error('이미지 리사이즈 오류:', error);
                alert('이미지 처리 중 오류가 발생했습니다.');
            }
        }
    });
    
    // 이모티콘 파일 선택 이벤트
    emoticonsInput.addEventListener('change', async function(e) {
        const files = Array.from(e.target.files);
        
        // 허용된 이미지 파일만 필터링
        const validImageFiles = files.filter(file => isValidImageType(file));
        
        if (validImageFiles.length !== files.length) {
            const invalidFiles = files.filter(file => !isValidImageType(file));
            if (invalidFiles.length > 0) {
                alert('지원되지 않는 파일 형식이 포함되어 있습니다.\\n지원되는 형식: PNG, JPG, JPEG, WebP, GIF');
                e.target.value = '';
                return;
            }
        }
        
        if (validImageFiles.length === 0) {
            e.target.value = '';
            return;
        }
        
        try {
            // 로딩 메시지 표시
            const previewContainer = document.getElementById('emoticon-preview');
            previewContainer.innerHTML = '<div class="loading">이미지 처리 중...</div>';
            
            // 진행률 표시를 위한 임시 메시지
            const totalFiles = validImageFiles.length;
            let processedFiles = 0;
            
            // 각 이미지를 150x150으로 리사이즈
            const resizedFiles = await Promise.all(
                validImageFiles.map(async function(file, index) {
                    const resizedFile = await resizeImage(file, 150, 150);
                    processedFiles++;
                    
                    // 진행률 표시 (선택적)
                    if (totalFiles > 3) {
                        console.log('이미지 처리 중... ' + processedFiles + '/' + totalFiles);
                    }
                    
                    return new File([resizedFile], file.name, { 
                        type: file.type, 
                        lastModified: Date.now() 
                    });
                })
            );
            
            // 기존 선택된 파일들에 추가
            selectedEmoticons = selectedEmoticons.concat(resizedFiles);
            updateEmoticonPreview();
            
        } catch (error) {
            console.error('이미지 리사이즈 오류:', error);
            alert('이미지 처리 중 오류가 발생했습니다.');
        }
        
        // input 값 리셋 (같은 파일을 다시 선택할 수 있도록)
        e.target.value = '';
    });
    
    // 텍스트 입력 검증 함수 (클라이언트 사이드)
    function validateTextInput(text, fieldName, maxLength = 100) {
        if (!text || text.trim().length === 0) {
            return { valid: false, message: fieldName + '은(는) 필수 항목입니다.' };
        }
        
        // HTML 태그 포함 검사
        if (/<[^>]*>/g.test(text)) {
            return { valid: false, message: fieldName + '에는 HTML 태그를 포함할 수 없습니다.' };
        }
        
        // 길이 검사
        if (text.trim().length > maxLength) {
            return { valid: false, message: fieldName + '은(는) ' + maxLength + '자를 초과할 수 없습니다.' };
        }
        
        if (text.trim().length < 2) {
            return { valid: false, message: fieldName + '은(는) 최소 2자 이상이어야 합니다.' };
        }
        
        return { valid: true, message: '' };
    }
    
    // 폼 제출 이벤트
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const title = document.getElementById('title').value.trim();
        const creator = document.getElementById('creator').value.trim();
        const creatorLink = document.getElementById('creator-link').value.trim();
        
        // 텍스트 입력 유효성 검사
        const titleValidation = validateTextInput(title, '제목', 50);
        if (!titleValidation.valid) {
            alert(titleValidation.message);
            return;
        }
        
        const creatorValidation = validateTextInput(creator, '제작자 이름', 30);
        if (!creatorValidation.valid) {
            alert(creatorValidation.message);
            return;
        }
        
        // URL 유효성 검사 (선택사항)
        if (creatorLink && creatorLink.length > 0) {
            try {
                // 프로토콜이 없으면 https:// 추가
                let testUrl = creatorLink;
                if (!testUrl.match(/^https?:\\/\\//i)) {
                    testUrl = 'https://' + testUrl;
                }
                new URL(testUrl); // URL 유효성 검사
            } catch (error) {
                alert('제작자 링크가 유효한 URL 형식이 아닙니다.');
                return;
            }
        }
        
        if (!selectedThumbnail) {
            alert('썸네일 이미지를 선택해주세요.');
            return;
        }
        
        if (selectedEmoticons.length < 3) {
            alert('최소 3개의 이미지를 선택해주세요.');
            return;
        }
        
        // 최종 확인
        const confirmed = confirm(\`업로드하시겠습니까?\\n\\n제목: \${title}\\n제작자: \${creator}\\n이미지 개수: \${selectedEmoticons.length}개\\n\\n모든 이미지는 검열을 거칩니다 (1-2분 소요)\\n업로드 후에는 수정할 수 없습니다.\`);
        if (!confirmed) {
            return;
        }
        
        // 로딩 상태 설정
        const submitBtn = form.querySelector('.submit-btn');
        const submitText = submitBtn.querySelector('.submit-text');
        const submitLoading = submitBtn.querySelector('.submit-loading');
        
        submitBtn.disabled = true;
        submitText.style.display = 'none';
        submitLoading.style.display = 'block';
        submitLoading.textContent = '업로드 중...';
        
        try {
            // FormData 생성
            const formData = new FormData();
            formData.append('title', title);
            formData.append('creator', creator);
            if (creatorLink) formData.append('creatorLink', creatorLink);
            formData.append('thumbnail', selectedThumbnail);
            
            selectedEmoticons.forEach(file => {
                formData.append('emoticons', file);
            });
            
            // API 호출
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
                const message = result.message || '이모티콘 팩이 성공적으로 업로드되었습니다!';
                
                // 업로드 성공 후 제한 상태 업데이트
                loadUploadLimitStatus();
                
                // 검증 정보가 있으면 상세 정보 표시
                if (result.validationInfo && result.validationInfo.rejected > 0) {
                    showUploadResult(true, message, result.validationInfo, result.id);
                } else {
                    showUploadResult(true, message, null, result.id);
                }
            } else {
                alert('업로드 실패: ' + (result.error || '알 수 없는 오류'));
            }
        } catch (error) {
            console.error('업로드 오류:', error);
            alert('업로드 중 오류가 발생했습니다.');
        } finally {
            // 로딩 상태 해제
            submitBtn.disabled = false;
            submitText.style.display = 'block';
            submitLoading.style.display = 'none';
        }
    });
    
    // 썸네일 미리보기 업데이트
    function updateThumbnailPreview() {
        const previewContainer = document.getElementById('thumbnail-preview');
        
        if (!selectedThumbnail) {
            previewContainer.innerHTML = '';
            previewContainer.classList.remove('has-files');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            previewContainer.innerHTML = \`
                <div class="preview-item">
                    <img src="\${e.target.result}" class="preview-image" alt="썸네일 미리보기">
                    <div class="preview-filename">\${selectedThumbnail.name}</div>
                    <button type="button" class="preview-remove" data-action="remove-thumbnail">×</button>
                </div>
            \`;
            previewContainer.classList.add('has-files');
        };
        reader.readAsDataURL(selectedThumbnail);
    }
    
    // 이모티콘 미리보기 업데이트
    function updateEmoticonPreview() {
        const previewContainer = document.getElementById('emoticon-preview');
        
        if (selectedEmoticons.length === 0) {
            previewContainer.innerHTML = '';
            previewContainer.classList.remove('has-files');
            return;
        }
        
        previewContainer.innerHTML = '';
        previewContainer.classList.add('has-files');
        
        selectedEmoticons.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                previewItem.innerHTML = \`
                    <img src="\${e.target.result}" class="preview-image" alt="이모티콘 \${index + 1}">
                    <div class="preview-filename">\${file.name}</div>
                    <button type="button" class="preview-remove" data-action="remove-emoticon" data-index="\${index}">×</button>
                \`;
                previewContainer.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });
    }
    
    // 이벤트 위임을 사용하여 제거 버튼 처리
    document.addEventListener('click', function(e) {
        if (e.target.matches('[data-action="remove-thumbnail"]')) {
            selectedThumbnail = null;
            thumbnailInput.value = '';
            updateThumbnailPreview();
        } else if (e.target.matches('[data-action="remove-emoticon"]')) {
            const index = parseInt(e.target.dataset.index);
            selectedEmoticons.splice(index, 1);
            updateEmoticonPreview();
        }
    });
    
    // 전역 함수들
    window.resetForm = function() {
        if (confirm('모든 입력 내용이 초기화됩니다. 계속하시겠습니까?')) {
            form.reset();
            selectedThumbnail = null;
            selectedEmoticons = [];
            updateThumbnailPreview();
            updateEmoticonPreview();
        }
    };
    
    // 업로드 결과 표시 함수
    window.showUploadResult = function(isSuccess, message, validationInfo, packId) {
        // 모달 생성
        const modal = document.createElement('div');
        modal.className = 'upload-result-modal';
        modal.innerHTML = \`
            <div class="modal-backdrop" \${isSuccess && packId ? '' : 'onclick="closeUploadModal()"'}></div>
            <div class="modal-content">
                <div class="modal-header \${isSuccess ? 'success' : 'error'}">
                    <span class="modal-icon"></span>
                    <h3>업로드 \${isSuccess ? '완료' : '실패'}</h3>
                </div>
                
                <div class="modal-body">
                    <p class="main-message">\${message}</p>
                    
                    \${validationInfo ? \`
                        <div class="validation-summary">
                            <h4>검열 결과</h4>
                            <div class="validation-stats">
                                <div class="stat-item">
                                    <span class="stat-label">제출된 이미지:</span>
                                    <span class="stat-value">\${validationInfo.totalSubmitted}개</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">승인된 이미지:</span>
                                    <span class="stat-value success">\${validationInfo.approved}개</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">거부된 이미지:</span>
                                    <span class="stat-value error">\${validationInfo.rejected}개</span>
                                </div>
                            </div>
                            
                            \${validationInfo.rejected > 0 && validationInfo.rejectedItems ? \`
                                <div class="rejected-details">
                                    <h5>거부된 이미지 상세</h5>
                                    <ul class="rejected-list">
                                        \${validationInfo.rejectedItems.map(item => 
                                            \`<li><strong>\${item.fileName}:</strong> \${item.reason}</li>\`
                                        ).join('')}
                                    </ul>
                                </div>
                            \` : ''}
                        </div>
                    \` : ''}
                </div>
                
                <div class="modal-footer">
                    \${isSuccess && packId ? \`
                        <button class="btn btn-primary" onclick="location.href='/pack/\${packId}'">업로드된 이모티콘 보기</button>
                        <button class="btn btn-secondary" onclick="location.href='/'">홈으로 이동</button>
                    \` : \`
                        <button class="btn btn-primary" onclick="closeUploadModal()">확인</button>
                    \`}
                </div>
            </div>
        \`;
        
        document.body.appendChild(modal);
        
        // 모달 닫기 함수를 전역으로 등록
        window.closeUploadModal = function() {
            document.body.removeChild(modal);
        };
        
        // ESC 키로 닫기 (성공시에는 막음)
        function handleEscape(e) {
            if (e.key === 'Escape' && !(isSuccess && packId)) {
                closeUploadModal();
                document.removeEventListener('keydown', handleEscape);
            }
        }
        document.addEventListener('keydown', handleEscape);
    };
    
    // 초기 미리보기 표시
    updateThumbnailPreview();
    updateEmoticonPreview();
}

// 업로드 제한 상태 로드 및 표시
async function loadUploadLimitStatus() {
    try {
        const response = await fetch('/api/upload-limit');
        const data = await response.json();
        
        if (response.ok) {
            const statusElement = document.getElementById('upload-limit-status');
            const limitTextElement = document.getElementById('limit-text');
            
                         if (statusElement && limitTextElement) {
                 if (data.allowed) {
                     limitTextElement.textContent = '오늘 ' + data.currentCount + '/' + data.limit + '개 업로드함 (남은 횟수: ' + data.remaining + '개)';
                     statusElement.className = 'upload-limit-notice info';
                 } else {
                     limitTextElement.textContent = '일일 업로드 제한에 도달했습니다. (' + data.currentCount + '/' + data.limit + '개) 내일 다시 시도해주세요.';
                     statusElement.className = 'upload-limit-notice warning';
                     
                     // 제한 도달 시 업로드 버튼 비활성화
                     const submitBtn = document.querySelector('.submit-btn');
                     if (submitBtn) {
                         submitBtn.disabled = true;
                         submitBtn.style.opacity = '0.6';
                         submitBtn.style.cursor = 'not-allowed';
                     }
                 }
                 statusElement.style.display = 'block';
             }
        }
    } catch (error) {
        console.error('업로드 제한 상태 로드 실패:', error);
    }
}

`; 