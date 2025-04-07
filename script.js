// DOM 元素
const uploadContainer = document.getElementById('upload-container');
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const convertAllBtn = document.getElementById('convert-all-btn');
const clearAllBtn = document.getElementById('clear-all-btn');
const fileListContainer = document.getElementById('file-list');
const overallProgressContainer = document.getElementById('overall-progress-container');
const overallProgress = document.getElementById('overall-progress');
const status = document.getElementById('status');
const downloadAllContainer = document.getElementById('download-all-container');
const downloadAllBtn = document.getElementById('download-all-btn');

// 品質設定
const outputFormatSelect = document.getElementById('output-format');
const audioQualitySlider = document.getElementById('audio-quality');
const qualityValueDisplay = document.getElementById('quality-value');
const sampleRateSelect = document.getElementById('sample-rate');

// 更新品質顯示
audioQualitySlider.addEventListener('input', () => {
    qualityValueDisplay.textContent = `${audioQualitySlider.value} kbps`;
});

// 檔案列表
let files = [];
let completedCount = 0;
let failedCount = 0;
let totalFiles = 0;
let audioContext = null;

// 初始化音訊上下文
function initAudioContext() {
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext({
            sampleRate: parseInt(sampleRateSelect.value)
        });
        return true;
    } catch (e) {
        status.textContent = '您的瀏覽器不支援音訊處理 API!';
        status.style.color = 'red';
        return false;
    }
}

// 上傳檔案事件
uploadBtn.addEventListener('click', () => {
    fileInput.click();
});

uploadContainer.addEventListener('click', (e) => {
    if (e.target !== uploadBtn) {
        fileInput.click();
    }
});

uploadContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadContainer.style.borderColor = '#2ecc71';
});

uploadContainer.addEventListener('dragleave', () => {
    uploadContainer.style.borderColor = '#3498db';
});

uploadContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadContainer.style.borderColor = '#3498db';
    
    if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
    }
});

fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        handleFiles(fileInput.files);
    }
});

// 處理多個檔案
function handleFiles(fileList) {
    let addedCount = 0;
    
    for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        
        // 檢查檔案類型
        if (!isVideoFile(file)) {
            continue;
        }
        
        // 檢查是否已存在相同檔案
        if (files.some(f => f.name === file.name && f.size === file.size)) {
            continue;
        }
        
        // 添加到檔案列表
        const fileId = `file-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const fileInfo = {
            id: fileId,
            file: file,
            name: file.name,
            size: file.size,
            status: 'pending', // pending, converting, completed, failed
            progress: 0,
            outputBlob: null,
            outputFormat: outputFormatSelect.value,
            quality: parseInt(audioQualitySlider.value),
            sampleRate: parseInt(sampleRateSelect.value)
        };
        
        files.push(fileInfo);
        addedCount++;
        
        // 更新 UI
        updateFileList();
    }
    
    if (addedCount > 0) {
        status.textContent = `已添加 ${addedCount} 個檔案，準備轉換!`;
        status.style.color = 'green';
        fileListContainer.style.display = 'block';
        convertAllBtn.disabled = false;
        clearAllBtn.disabled = false;
    }
}

// 檢查是否為支援的影片檔案
function isVideoFile(file) {
    const supportedTypes = [
        'video/mp4',
        'video/webm',
        'video/avi',
        'video/quicktime', // MOV
        'video/x-matroska', // MKV
        'video/x-flv',
        'video/x-ms-wmv'
    ];
    
    // 檢查 MIME 類型
    if (supportedTypes.includes(file.type)) {
        return true;
    }
    
    // 檢查副檔名
    const supportedExtensions = ['.mp4', '.avi', '.mov', '.webm', '.mkv', '.flv', '.wmv'];
    const fileName = file.name.toLowerCase();
    
    return supportedExtensions.some(ext => fileName.endsWith(ext));
}

// 更新檔案列表 UI
function updateFileList() {
    fileListContainer.innerHTML = '';
    
    files.forEach(fileInfo => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.id = fileInfo.id;
        
        // 設定檔案項目內容
        let statusClass, statusText;
        
        switch (fileInfo.status) {
            case 'pending':
                statusClass = 'pending';
                statusText = '待處理';
                break;
            case 'converting':
                statusClass = 'converting';
                statusText = `轉換中 ${fileInfo.progress}%`;
                break;
            case 'completed':
                statusClass = 'completed';
                statusText = '完成';
                break;
            case 'failed':
                statusClass = 'failed';
                statusText = '失敗';
                break;
        }
        
        const fileSizeMB = (fileInfo.size / (1024 * 1024)).toFixed(2);
        
        fileItem.innerHTML = `
            <div class="file-name" title="${fileInfo.name}">${fileInfo.name} (${fileSizeMB} MB)</div>
            <div class="file-status ${statusClass}">${statusText}</div>
        `;
        
        // 添加進度條 (如果正在轉換)
        if (fileInfo.status === 'converting') {
            const progressContainer = document.createElement('div');
            progressContainer.className = 'progress-container';
            progressContainer.style.display = 'block';
            progressContainer.style.width = '100%';
            progressContainer.style.marginTop = '5px';
            
            const progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            
            const progress = document.createElement('div');
            progress.className = 'progress';
            progress.style.width = `${fileInfo.progress}%`;
            
            progressBar.appendChild(progress);
            progressContainer.appendChild(progressBar);
            fileItem.appendChild(progressContainer);
        }
        
        // 添加下載按鈕 (如果完成)
        if (fileInfo.status === 'completed') {
            const buttonsContainer = document.createElement('div');
            
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-btn';
            downloadBtn.textContent = '下載';
            downloadBtn.addEventListener('click', () => {
                downloadFile(fileInfo);
            });
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.textContent = '移除';
            removeBtn.addEventListener('click', () => {
                removeFile(fileInfo.id);
            });
            
            buttonsContainer.appendChild(downloadBtn);
            buttonsContainer.appendChild(removeBtn);
            fileItem.appendChild(buttonsContainer);
        }
        
        fileListContainer.appendChild(fileItem);
    });
    
    // 更新總進度
    updateOverallProgress();
}

// 更新單個檔案的狀態
function updateFileStatus(fileId, status, progress = 0) {
    const fileIndex = files.findIndex(f => f.id === fileId);
    
    if (fileIndex !== -1) {
        files[fileIndex].status = status;
        files[fileIndex].progress = progress;
        
        // 更新檔案列表
        updateFileList();
        
        // 更新計數
        if (status === 'completed') {
            completedCount++;
        } else if (status === 'failed') {
            failedCount++;
        }
        
        // 檢查所有檔案是否都已處理
        checkAllCompleted();
    }
}

// 更新檔案進度
function updateFileProgress(fileId, progress) {
    const fileIndex = files.findIndex(f => f.id === fileId);
    
    if (fileIndex !== -1) {
        files[fileIndex].progress = progress;
        
        // 更新檔案列表中的進度顯示
        const fileItemElement = document.getElementById(fileId);
        
        if (fileItemElement) {
            const statusElement = fileItemElement.querySelector('.file-status');
            const progressElement = fileItemElement.querySelector('.progress');
            
            if (statusElement) {
                statusElement.textContent = `轉換中 ${progress}%`;
            }
            
            if (progressElement) {
                progressElement.style.width = `${progress}%`;
            }
        }
        
        // 更新總進度
        updateOverallProgress();
    }
}

// 更新總體進度
function updateOverallProgress() {
    let totalProgress = 0;
    
    files.forEach(fileInfo => {
        if (fileInfo.status === 'completed') {
            totalProgress += 100;
        } else if (fileInfo.status === 'converting') {
            totalProgress += fileInfo.progress;
        }
    });
    
    const overallPercentage = files.length > 0 ? 
        Math.floor(totalProgress / (files.length * 100) * 100) : 0;
    
    overallProgress.style.width = `${overallPercentage}%`;
}

// 檢查所有檔案是否都已處理完畢
function checkAllCompleted() {
    const totalProcessed = completedCount + failedCount;
    
    if (totalProcessed === totalFiles && totalFiles > 0) {
        status.textContent = `轉換完成: ${completedCount} 成功, ${failedCount} 失敗`;
        status.style.color = failedCount > 0 ? '#e67e22' : '#2ecc71';
        
        if (completedCount > 0) {
            downloadAllContainer.style.display = 'block';
        }
        
        convertAllBtn.disabled = false;
    }
}

// 移除檔案
function removeFile(fileId) {
    const fileIndex = files.findIndex(f => f.id === fileId);
    
    if (fileIndex !== -1) {
        const fileStatus = files[fileIndex].status;
        
        if (fileStatus === 'completed') {
            completedCount--;
        } else if (fileStatus === 'failed') {
            failedCount--;
        }
        
        // 移除檔案
        files.splice(fileIndex, 1);
        
        // 更新 UI
        updateFileList();
        
        if (files.length === 0) {
            fileListContainer.style.display = 'none';
            convertAllBtn.disabled = true;
            clearAllBtn.disabled = true;
            downloadAllContainer.style.display = 'none';
            status.textContent = '';
        }
    }
}

// 清除所有檔案
clearAllBtn.addEventListener('click', () => {
    files = [];
    completedCount = 0;
    failedCount = 0;
    totalFiles = 0;
    
    // 更新 UI
    fileListContainer.style.display = 'none';
    overallProgressContainer.style.display = 'none';
    downloadAllContainer.style.display = 'none';
    status.textContent = '';
    convertAllBtn.disabled = true;
    clearAllBtn.disabled = true;
});

// 下載單個檔案
function downloadFile(fileInfo) {
    if (!fileInfo.outputBlob) {
        status.textContent = '下載失敗: 檔案不存在!';
        status.style.color = 'red';
        return;
    }
    
    // 創建輸出檔案名稱
    const outputFileName = fileInfo.name.replace(/\.[^/.]+$/, `.${fileInfo.outputFormat}`);
    
    // 創建下載連結
    const link = document.createElement('a');
    link.href = URL.createObjectURL(fileInfo.outputBlob);
    link.download = outputFileName;
    
    // 觸發下載
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 釋放URL對象
    setTimeout(() => {
        URL.revokeObjectURL(link.href);
    }, 100);
}

// 下載所有檔案 (ZIP)
downloadAllBtn.addEventListener('click', async () => {
    const completedFiles = files.filter(f => f.status === 'completed');
    
    if (completedFiles.length === 0) {
        status.textContent = '沒有可下載的檔案!';
        status.style.color = 'red';
        return;
    }
    
    status.textContent = '正在準備ZIP檔案...';
    status.style.color = 'blue';
    
    try {
        const zip = new JSZip();
        
        // 添加所有完成的檔案到ZIP
        for (const fileInfo of completedFiles) {
            const outputFileName = fileInfo.name.replace(/\.[^/.]+$/, `.${fileInfo.outputFormat}`);
            zip.file(outputFileName, fileInfo.outputBlob);
        }
        
        // 生成ZIP檔案
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        // 下載ZIP
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = 'converted_audio_files.zip';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 釋放URL對象
        setTimeout(() => {
            URL.revokeObjectURL(link.href);
        }, 100);
        
        status.textContent = 'ZIP檔案下載成功!';
        status.style.color = 'green';
    } catch (error) {
        console.error('生成ZIP檔案錯誤:', error);
        status.textContent = '生成ZIP檔案失敗!';
        status.style.color = 'red';
    }
});

// 轉換全部檔案
convertAllBtn.addEventListener('click', async () => {
    if (files.length === 0) return;
    
    if (!initAudioContext()) return;
    
    convertAllBtn.disabled = true;
    clearAllBtn.disabled = true;
    overallProgressContainer.style.display = 'block';
    downloadAllContainer.style.display = 'none';
    
    // 重置計數
    completedCount = 0;
    failedCount = 0;
    totalFiles = files.length;
    
    status.textContent = '開始批次轉換...';
    status.style.color = '#3498db';
    
    // 遍歷每個檔案進行轉換
    for (let i = 0; i < files.length; i++) {
        const fileInfo = files[i];
        
        // 跳過已完成的檔案
        if (fileInfo.status === 'completed') {
            completedCount++;
            continue;
        }
        
        // 標記為轉換中
        updateFileStatus(fileInfo.id, 'converting', 0);
        
        try {
            // 儲存當前的輸出格式、品質設定
            fileInfo.outputFormat = outputFormatSelect.value;
            fileInfo.quality = parseInt(audioQualitySlider.value);
            fileInfo.sampleRate = parseInt(sampleRateSelect.value);
            
            // 進行轉換
            await processFile(fileInfo);
        } catch (error) {
            console.error(`轉換 ${fileInfo.name} 時發生錯誤:`, error);
            updateFileStatus(fileInfo.id, 'failed');
            failedCount++;
        }
    }
    
    checkAllCompleted();
    clearAllBtn.disabled = false;
});

// 處理檔案轉換
async function processFile(fileInfo) {
    return new Promise((resolve, reject) => {
        updateFileProgress(fileInfo.id, 10);
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const arrayBuffer = e.target.result;
            updateFileProgress(fileInfo.id, 30);
            
            try {
                // 使用 AudioContext 解碼音訊
                audioContext.decodeAudioData(arrayBuffer)
                    .then(function(audioBuffer) {
                        updateFileProgress(fileInfo.id, 60);
                        
                        // 轉換為指定格式
                        const wavBuffer = audioBufferToWav(audioBuffer, fileInfo.sampleRate);
                        
                        // 根據選擇的格式設定 MIME 類型
                        let mimeType;
                        switch (fileInfo.outputFormat) {
                            case 'mp3':
                                mimeType = 'audio/mpeg';
                                break;
                            case 'wav':
                                mimeType = 'audio/wav';
                                break;
                            case 'ogg':
                                