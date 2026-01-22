import * as webllm from "@mlc-ai/web-llm";

let engine = null;
let isModelLoaded = false;

// Model configuration
const MODEL_CONFIG = {
    model_url: "https://huggingface.co/Priyansu19/gemma-270m-ai-detector/resolve/main/",
    model_id: "gemma-270m-ai-detector",
    model_lib_url: "https://huggingface.co/Priyansu19/gemma-270m-ai-detector/resolve/main/gemma-270m-ai-detector-webgpu.wasm",
};

// Log to both console and UI
function log(message, isError = false) {
    console.log(message);
    const statusEl = document.getElementById('status');
    if (statusEl) {
        const timestamp = new Date().toLocaleTimeString();
        statusEl.textContent = `[${timestamp}] ${message}`;
        statusEl.className = isError ? 'status error' : 'status loading';
    }
}

// Initialize model
async function initModel() {
    try {
        const statusEl = document.getElementById('status');
        const progressEl = document.getElementById('progress');
        const progressBar = document.getElementById('progress-bar');
        
        log('Starting model initialization...');
        progressEl.style.display = 'block';

        // Check WebGPU support
        if (!navigator.gpu) {
            throw new Error('WebGPU is not supported in this browser. Please use Chrome/Edge 113+');
        }
        log('✓ WebGPU detected');

        // Progress callback with detailed logging
        const initProgressCallback = (progress) => {
            console.log('Progress update:', progress);
            
            // Log different types of progress
            if (progress.text) {
                log(progress.text);
            }
            
            if (progress.progress !== undefined) {
                const percent = Math.round(progress.progress * 100);
                progressBar.style.width = percent + '%';
                log(`Loading: ${percent}%`);
            }
        };

        // Create app config
        const appConfig = {
            model_list: [
                {
                    model: MODEL_CONFIG.model_url,
                    model_id: MODEL_CONFIG.model_id,
                    model_lib: MODEL_CONFIG.model_lib_url,
                    overrides: {
                        context_window_size: 8192,
                        sliding_window_size: -1,
                    }
                }
            ]
        };

        log('Creating MLCEngine instance...');
        console.log('Config:', appConfig);

        // Create the engine with timeout handling
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Model loading timeout (5 minutes)')), 300000);
        });

        const enginePromise = webllm.CreateMLCEngine(
            MODEL_CONFIG.model_id,
            { 
                initProgressCallback: initProgressCallback,
                appConfig: appConfig 
            }
        );

        log('Downloading model files from HuggingFace...');
        log('This may take 2-5 minutes on first load (150MB download)');
        
        engine = await Promise.race([enginePromise, timeoutPromise]);

        console.log('Model loaded successfully!');
        isModelLoaded = true;
        
        statusEl.textContent = '✓ Model ready!';
        statusEl.className = 'status ready';
        progressEl.style.display = 'none';
        
        // Enable UI
        document.getElementById('textInput').disabled = false;
        document.getElementById('analyzeBtn').disabled = false;

        // Notify background script
        chrome.runtime.sendMessage({ type: 'MODEL_LOADED' }).catch(() => {});

        // Check for pending text
        checkPendingText();

    } catch (error) {
        console.error('FATAL ERROR loading model:', error);
        log(`Error: ${error.message}`, true);
        
        // Show detailed error info
        const statusEl = document.getElementById('status');
        statusEl.innerHTML = `
            <strong>Error loading model:</strong><br>
            ${error.message}<br><br>
            <small>Check console (F12) for details</small>
        `;
        statusEl.className = 'status error';
        document.getElementById('progress').style.display = 'none';
        
        // Provide troubleshooting hints
        if (error.message.includes('WebGPU')) {
            statusEl.innerHTML += '<br><br>Go to chrome://gpu to check WebGPU support';
        }
        if (error.message.includes('fetch') || error.message.includes('network')) {
            statusEl.innerHTML += '<br><br>Check if HuggingFace URLs are accessible';
        }
    }
}

// Check for pending text from context menu
async function checkPendingText() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_PENDING_TEXT' });
        if (response && response.text) {
            document.getElementById('textInput').value = response.text;
            setTimeout(() => {
                document.getElementById('analyzeBtn').click();
            }, 500);
        }
    } catch (error) {
        console.log('No pending text:', error);
    }
}

// Analyze text function
async function analyzeText(text) {
    if (!text || !text.trim()) {
        return null;
    }

    if (!isModelLoaded || !engine) {
        throw new Error('Model not loaded yet');
    }

    try {
        console.log('Analyzing text length:', text.length);

        const messages = [
            {
                role: "system",
                content: `You are a classifier working on a problem described in task_description XML block:
<task_description>Classify user-generated text content to detect whether it was likely generated by AI or written by a human</task_description>
Classify the input into one of the available classes, each class has a name in class_name and description in class_description XML block:

<class_name>ai_generated</class_name>
<class_description>Content that shows signs of AI generation: overly formal or generic language, repetitive patterns, lack of personal voice, artificial enthusiasm, typical AI writing markers like 'delve', 'tapestry', 'landscape', 'paradigm shift', excessive politeness, corporate-speak in informal contexts, perfectly structured responses without natural flow, or absence of casual mistakes</class_description>

<class_name>human_written</class_name>
<class_description>Content that appears genuinely human-written: natural conversational flow, authentic personal voice, casual mistakes or typos, informal language, slang, abbreviations (lol, wtf, ngl), specific personal details, genuine emotion, creative expression, internet culture references, or casual grammar that lacks typical AI patterns</class_description>

Write the name of the predicted class inside output XML block
For example, if the input matches class test_output, write
<o>test_output</o>`
            },
            {
                role: "user",
                content: `Now for the real task, classify the following example
<question>${text}</question>`
            }
        ];

        console.log('Calling model inference...');
        const reply = await engine.chat.completions.create({
            messages: messages,
            temperature: 0.1,
            max_tokens: 5,
            repetition_penalty: 1.5,
            stop: ["<|im_start|>", "<|im_end|>", "</", "\n"],
        });

        const response = reply.choices[0].message.content.trim();
        console.log('Raw model response:', response);

        const cleanResponse = response.split(/[\s_<>]/)[0].toLowerCase();
        console.log('Cleaned response:', cleanResponse);
        
        if (cleanResponse === 'ai' || cleanResponse.startsWith('ai_') || cleanResponse.startsWith('ai-')) {
            return 'ai';
        } else if (cleanResponse === 'human' || cleanResponse.startsWith('human_') || cleanResponse.startsWith('human-')) {
            return 'human';
        }
        
        return 'unknown';

    } catch (error) {
        console.error('Error during analysis:', error);
        throw error;
    }
}

// Display result
function displayResult(classification) {
    const resultEl = document.getElementById('result');
    const resultLabel = resultEl.querySelector('.result-label');
    const resultText = resultEl.querySelector('.result-text');

    if (classification === 'ai') {
        resultEl.className = 'result ai';
        resultLabel.textContent = '🤖 AI-Generated';
        resultText.textContent = 'This text appears to be generated by AI.';
    } else if (classification === 'human') {
        resultEl.className = 'result human';
        resultLabel.textContent = '✍️ Human-Written';
        resultText.textContent = 'This text appears to be written by a human.';
    } else {
        resultEl.className = 'result';
        resultLabel.textContent = '❓ Uncertain';
        resultText.textContent = 'Could not determine classification.';
    }

    resultEl.style.display = 'block';
}

// Handle analyze button
document.getElementById('analyzeBtn').addEventListener('click', async () => {
    const textInput = document.getElementById('textInput').value.trim();
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultEl = document.getElementById('result');
    
    if (!textInput) {
        alert('Please enter some text to analyze!');
        return;
    }

    try {
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = 'Analyzing...';
        resultEl.style.display = 'none';

        const classification = await analyzeText(textInput);
        displayResult(classification);

        chrome.runtime.sendMessage({
            type: 'ANALYSIS_COMPLETE',
            classification: classification,
            text: textInput
        }).catch(() => {});

    } catch (error) {
        console.error('Analysis error:', error);
        alert(`Error: ${error.message}`);
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Analyze Text';
    }
});

// Start loading immediately
console.log('=== AI Slop Detector Started ===');
console.log('WebLLM version:', webllm);
console.log('Model config:', MODEL_CONFIG);
initModel();