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
    } else if (path === '/contact') {
        setupContactForm();
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
    
    // 실시간 검증 함수 - 시각적 피드백만 (에러는 표시하지 않음)
    function setupRealTimeValidation(input, fieldName, maxLength) {
        let timeoutId;
        input.addEventListener('input', function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const value = input.value.trim();
                if (value.length > maxLength) {
                    // 길이 초과 시에만 약간의 시각적 피드백 (에러 메시지 없음)
                    input.style.borderColor = '#ffaa00';
                    input.title = fieldName + ' 글자 수: ' + value.length + '/' + maxLength;
                } else {
                    input.style.borderColor = '';
                    input.title = '';
                }
            }, 300);
        });
    }
    
    // 각 입력 필드에 실시간 검증 적용 (완전히 자유로운 입력 허용)
    // if (titleInput) setupRealTimeValidation(titleInput, '제목', 50);
    // if (creatorInput) setupRealTimeValidation(creatorInput, '제작자 이름', 30);
    if (creatorLinkInput) {
        creatorLinkInput.addEventListener('blur', function() {
            const value = this.value.trim();
            if (value && value.length > 0) {
                try {
                    let testUrl = value;
                    if (!new RegExp('^https?://', 'i').test(testUrl)) {
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
    
    // WebP 파일이 애니메이션인지 확인하는 함수
    function isAnimatedWebP(arrayBuffer) {
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // WebP 파일인지 확인 (RIFF....WEBP)
        if (uint8Array.length < 12) return false;
        
        const riffHeader = String.fromCharCode(...uint8Array.slice(0, 4));
        const webpHeader = String.fromCharCode(...uint8Array.slice(8, 12));
        
        if (riffHeader !== 'RIFF' || webpHeader !== 'WEBP') {
            return false;
        }
        
        // ANIM 청크를 찾아 애니메이션 여부 확인
        for (let i = 12; i < uint8Array.length - 4; i++) {
            const chunkType = String.fromCharCode(...uint8Array.slice(i, i + 4));
            if (chunkType === 'ANIM') {
                return true;
            }
        }
        
        return false;
    }
    
    // 애니메이션 파일인지 확인 (GIF 또는 애니메이션 WebP)
    function isAnimatedImage(file, arrayBuffer) {
        if (!file || !file.type) return false;
        
        const fileType = file.type.toLowerCase();
        
        // GIF는 항상 애니메이션으로 처리
        if (fileType === 'image/gif') {
            return true;
        }
        
        // WebP의 경우 애니메이션 여부 확인
        if (fileType === 'image/webp' && arrayBuffer) {
            return isAnimatedWebP(arrayBuffer);
        }
        
        return false;
    }
    
    // 애니메이션 파일 검증 함수 (GIF 및 애니메이션 WebP)
    function validateAnimatedFile(file, maxWidth = 200, maxHeight = 200, maxSize = 1 * 1024 * 1024) {
        return new Promise((resolve, reject) => {
            // 파일 크기 체크 (1MB)
            if (file.size > maxSize) {
                const fileTypeName = file.type === 'image/gif' ? 'GIF' : '애니메이션 WebP';
                reject(fileTypeName + ' 파일 크기가 ' + Math.round(maxSize / (1024 * 1024)) + 'MB를 초과합니다. (현재: ' + Math.round(file.size / (1024 * 1024) * 100) / 100 + 'MB)');
                return;
            }
            
            // 이미지 해상도 체크
            const img = new Image();
            img.onload = function() {
                if (img.width > maxWidth || img.height > maxHeight) {
                    const fileTypeName = file.type === 'image/gif' ? 'GIF' : '애니메이션 WebP';
                    reject(fileTypeName + ' 해상도가 ' + maxWidth + 'x' + maxHeight + '를 초과합니다. (현재: ' + img.width + 'x' + img.height + ')');
                } else {
                    resolve(true);
                }
                URL.revokeObjectURL(img.src);
            };
            img.onerror = function() {
                const fileTypeName = file.type === 'image/gif' ? 'GIF' : '애니메이션 WebP';
                reject(fileTypeName + ' 파일을 읽을 수 없습니다.');
                URL.revokeObjectURL(img.src);
            };
            img.src = URL.createObjectURL(file);
        });
    }

    // 이미지 리사이즈 함수
    function resizeImage(file, maxWidth, maxHeight) {
        return new Promise(async (resolve, reject) => {
            // 애니메이션 파일인지 확인하기 위해 arrayBuffer 읽기
            let fileArrayBuffer;
            try {
                fileArrayBuffer = await file.arrayBuffer();
            } catch (error) {
                reject('파일을 읽을 수 없습니다.');
                return;
            }
            
            // 애니메이션 파일의 경우 검증 후 원본 반환 (애니메이션 보존)
            if (isAnimatedImage(file, fileArrayBuffer)) {
                validateAnimatedFile(file, maxWidth, maxHeight)
                    .then(() => resolve(file))
                    .catch((error) => reject(error));
                return;
            }
            
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
                
                // GIF는 지원되지 않으므로 다른 형식으로 변환
                let outputType = file.type;
                if (file.type.toLowerCase() === 'image/gif') {
                    outputType = 'image/png'; // GIF를 PNG로 변환
                }
                
                // Blob으로 변환
                canvas.toBlob(resolve, outputType, 0.8);
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
                
                // 애니메이션 파일의 경우 원본을 그대로 사용 (애니메이션 보존)
                const fileArrayBuffer = await file.arrayBuffer();
                if (isAnimatedImage(file, fileArrayBuffer)) {
                    selectedThumbnail = resizedFile; // 원본 애니메이션 파일 그대로 사용
                } else {
                    selectedThumbnail = new File([resizedFile], file.name, { 
                        type: file.type, 
                        lastModified: Date.now() 
                    });
                }
                updateThumbnailPreview();
            } catch (error) {
                console.error('이미지 처리 오류:', error);
                alert(error || '이미지 처리 중 오류가 발생했습니다.');
                e.target.value = '';
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
            const resizeResults = await Promise.allSettled(
                validImageFiles.map(async function(file, index) {
                    const resizedFile = await resizeImage(file, 150, 150);
                    processedFiles++;
                    
                    // 진행률 표시 (선택적)
                    if (totalFiles > 3) {
                        console.log('이미지 처리 중... ' + processedFiles + '/' + totalFiles);
                    }
                    
                    // 애니메이션 파일의 경우 원본을 그대로 사용 (애니메이션 보존)
                    const fileArrayBuffer = await file.arrayBuffer();
                    if (isAnimatedImage(file, fileArrayBuffer)) {
                        return resizedFile; // 원본 애니메이션 파일 그대로 사용
                    } else {
                        return new File([resizedFile], file.name, { 
                            type: file.type, 
                            lastModified: Date.now() 
                        });
                    }
                })
            );
            
            // 성공한 파일들만 필터링
            const resizedFiles = [];
            const failedFiles = [];
            
            resizeResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    resizedFiles.push(result.value);
                } else {
                    failedFiles.push({
                        name: validImageFiles[index].name,
                        error: result.reason
                    });
                }
            });
            
            // 실패한 파일들이 있으면 알림
            if (failedFiles.length > 0) {
                let errorMessage = '다음 파일들이 처리되지 않았습니다:\\n';
                failedFiles.forEach(failed => {
                    errorMessage += '- ' + failed.name + ': ' + failed.error + '\\n';
                });
                alert(errorMessage);
            }
            
            // 성공한 파일들만 추가
            if (resizedFiles.length > 0) {
                selectedEmoticons = selectedEmoticons.concat(resizedFiles);
                updateEmoticonPreview();
            } else {
                // 미리보기 컨테이너 초기화
                const previewContainer = document.getElementById('emoticon-preview');
                previewContainer.innerHTML = '';
            }
            
        } catch (error) {
            console.error('이미지 처리 오류:', error);
            alert(error || '이미지 처리 중 오류가 발생했습니다.');
            // 미리보기 컨테이너 초기화
            const previewContainer = document.getElementById('emoticon-preview');
            previewContainer.innerHTML = '';
        }
        
        // input 값 리셋 (같은 파일을 다시 선택할 수 있도록)
        e.target.value = '';
    });
    
    // 텍스트 입력 검증 함수 (클라이언트 사이드) - 서버에서 안전하게 처리하므로 기본 검증만
    function validateTextInput(text, fieldName, maxLength = 100) {
        if (!text || text.trim().length === 0) {
            return { valid: false, message: fieldName + '은(는) 필수 항목입니다.' };
        }
        
        // 길이 검사만 수행 (서버에서 보안 처리함)
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
        
        // 기본 입력 검사만 (서버에서 모든 검증 처리)
        if (!title || title.trim().length === 0) {
            alert('제목은 필수 항목입니다.');
            return;
        }
        
        if (!creator || creator.trim().length === 0) {
            alert('제작자 이름은 필수 항목입니다.');
            return;
        }
        
        // URL 유효성 검사 (선택사항)
        if (creatorLink && creatorLink.length > 0) {
            try {
                // 프로토콜이 없으면 https:// 추가
                let testUrl = creatorLink;
                if (!new RegExp('^https?://', 'i').test(testUrl)) {
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
        const confirmed = confirm('업로드하시겠습니까?\\n\\n제목: ' + title + '\\n제작자: ' + creator + '\\n이미지 개수: ' + selectedEmoticons.length + '개\\n\\n모든 이미지는 검열을 거칩니다 (1-2분 소요)\\n업로드 후에는 수정할 수 없습니다.');
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
            previewContainer.innerHTML =
                '<div class="preview-item">' +
                    '<img src="' + e.target.result + '" class="preview-image" alt="썸네일 미리보기">' +
                    '<div class="preview-filename">' + selectedThumbnail.name + '</div>' +
                    '<button type="button" class="preview-remove" data-action="remove-thumbnail">×</button>' +
                '</div>';
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
                previewItem.innerHTML =
                    '<img src="' + e.target.result + '" class="preview-image" alt="이모티콘 ' + (index + 1) + '">' +
                    '<div class="preview-filename">' + file.name + '</div>' +
                    '<button type="button" class="preview-remove" data-action="remove-emoticon" data-index="' + index + '">×</button>';
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

        let validationHtml = '';
        if (validationInfo) {
            let rejectedItemsHtml = '';
            if (validationInfo.rejected > 0 && validationInfo.rejectedItems) {
                rejectedItemsHtml =
                    '<div class="rejected-details">' +
                        '<h5>거부된 이미지 상세</h5>' +
                        '<ul class="rejected-list">' +
                            validationInfo.rejectedItems.map(item => 
                                '<li><strong>' + item.fileName + ':</strong> ' + item.reason + '</li>'
                            ).join('') +
                        '</ul>' +
                    '</div>';
            }

            validationHtml =
                '<div class="validation-summary">' +
                    '<h4>검열 결과</h4>' +
                    '<div class="validation-stats">' +
                        '<div class="stat-item">' +
                            '<span class="stat-label">제출된 이미지:</span>' +
                            '<span class="stat-value">' + validationInfo.totalSubmitted + '개</span>' +
                        '</div>' +
                        '<div class="stat-item">' +
                            '<span class="stat-label">승인된 이미지:</span>' +
                            '<span class="stat-value success">' + validationInfo.approved + '개</span>' +
                        '</div>' +
                        '<div class="stat-item">' +
                            '<span class="stat-label">거부된 이미지:</span>' +
                            '<span class="stat-value error">' + validationInfo.rejected + '개</span>' +
                        '</div>' +
                    '</div>' +
                    rejectedItemsHtml +
                '</div>';
        }

        let footerHtml = '';
        if (isSuccess && packId) {
            footerHtml =
                '<button class="btn btn-primary" onclick="location.href=\'/pack/' + packId + '\'">업로드된 이모티콘 보기</button>' +
                '<button class="btn btn-secondary" onclick="location.href=\'/\'">홈으로 이동</button>';
        } else {
            footerHtml = '<button class="btn btn-primary" onclick="closeUploadModal()">확인</button>';
        }

        modal.innerHTML =
            '<div class="modal-backdrop" ' + (isSuccess && packId ? '' : 'onclick="closeUploadModal()"') + '></div>' +
            '<div class="modal-content">' +
                '<div class="modal-header ' + (isSuccess ? 'success' : 'error') + '">' +
                    '<span class="modal-icon"></span>' +
                    '<h3>업로드 ' + (isSuccess ? '완료' : '실패') + '</h3>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<p class="main-message">' + message + '</p>' +
                    validationHtml +
                '</div>' +
                '<div class="modal-footer">' +
                    footerHtml +
                '</div>' +
            '</div>';
        
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

// 문의하기 폼 설정
function setupContactForm() {
    const form = document.getElementById('contact-form');
    
    if (!form) return;
    
    // 폼 제출 이벤트
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('contact-email').value.trim();
        const subject = document.getElementById('contact-subject').value.trim();
        const message = document.getElementById('contact-message').value.trim();
        
        // 기본 유효성 검사
        if (!email || !subject || !message) {
            alert('모든 필드를 입력해주세요.');
            return;
        }
        
        if (!isValidEmail(email)) {
            alert('올바른 이메일 주소를 입력해주세요.');
            return;
        }
        
        // 최종 확인
        const confirmed = confirm('문의를 전송하시겠습니까?\\n\\n제목: ' + subject + '\\n이메일: ' + email);
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
        submitLoading.textContent = '전송 중...';
        
        try {
            // API 호출
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    subject: subject,
                    message: message
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert('문의가 성공적으로 전송되었습니다! 빠른 시일 내에 답변드리겠습니다.');
                form.reset();
            } else {
                alert('문의 전송에 실패했습니다: ' + (result.error || '알 수 없는 오류'));
            }
        } catch (error) {
            console.error('문의 전송 오류:', error);
            alert('문의 전송 중 오류가 발생했습니다.');
        } finally {
            // 로딩 상태 해제
            submitBtn.disabled = false;
            submitText.style.display = 'block';
            submitLoading.style.display = 'none';
        }
    });
}

// 이메일 유효성 검사 함수
function isValidEmail(email) {
    const emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return emailPattern.test(email);
}

// 문의 폼 초기화 함수
window.resetContactForm = function() {
    const form = document.getElementById('contact-form');
    if (form && confirm('모든 입력 내용이 초기화됩니다. 계속하시겠습니까?')) {
        form.reset();
    }
};

`; 