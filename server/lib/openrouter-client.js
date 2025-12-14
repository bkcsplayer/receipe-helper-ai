/**
 * OpenRouter Unified Client
 * 
 * 遵循工作区规则：
 * 1. 启动时调用 /models API 获取可用模型列表
 * 2. 推理任务使用 reasoning 模型 + reasoning.effort: high
 * 3. 使用 models: [primary, fallback1, fallback2] 自动回退
 * 4. 指数退避重试 (429/5xx)
 */

import axios from 'axios';

// ============ Configuration ============
const BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const API_KEY = process.env.OPENROUTER_API_KEY || '';
const APP_URL = process.env.APP_URL || 'https://receipe2.khtain.com';
const APP_NAME = process.env.APP_NAME || 'Receipt Helper AI';

// Pinned models from environment (optional overrides)
const PIN_VISION_MODEL = process.env.OPENROUTER_VISION_MODEL;
const PIN_REASONING_MODEL = process.env.OPENROUTER_REASONING_MODEL;
const PIN_DEFAULT_MODEL = process.env.OPENROUTER_DEFAULT_MODEL;

// ============ State ============
let cachedModels = null;
let modelsByCapability = {
  vision: [],
  reasoning: [],
  default: []
};

// ============ Helpers ============
function mustHaveKey() {
  if (!API_KEY) {
    throw new Error('❌ OPENROUTER_API_KEY is not configured');
  }
}

function getHeaders() {
  return {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': APP_URL,
    'X-Title': APP_NAME
  };
}

/**
 * Exponential backoff retry wrapper
 */
async function withRetry(fn, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const status = error.response?.status;
      
      // Only retry on rate limit or server errors
      if (status === 429 || (status >= 500 && status < 600)) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        console.log(`⏳ Retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms (status: ${status})`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      
      // Don't retry other errors
      throw error;
    }
  }
  throw lastError;
}

/**
 * Check if model supports vision (image input)
 */
function isVisionModel(model) {
  const arch = model.architecture || {};
  if (arch.modality === 'multimodal' || arch.input_modalities?.includes('image')) {
    return true;
  }
  // Fallback: check model ID/name for known vision models
  const id = (model.id || '').toLowerCase();
  return id.includes('vision') || 
         id.includes('claude-3') || 
         id.includes('gpt-4o') ||
         id.includes('gemini-pro-vision') ||
         id.includes('gemini-1.5');
}

/**
 * Check if model supports reasoning
 */
function isReasoningModel(model) {
  const sp = model.supported_parameters || [];
  if (Array.isArray(sp) && sp.includes('reasoning')) {
    return true;
  }
  // Fallback: check model ID/name
  const id = (model.id || '').toLowerCase();
  const name = (model.name || '').toLowerCase();
  const hay = `${id} ${name}`;
  return /reasoning|thinking|\bo1\b|\br1\b/.test(hay);
}

// ============ Public API ============

/**
 * Initialize OpenRouter client - MUST be called at server startup
 * Fetches available models and caches them
 */
export async function initOpenRouterModels() {
  if (cachedModels !== null) {
    return cachedModels;
  }

  mustHaveKey();
  
  console.log('🔍 Fetching OpenRouter models list...');
  
  try {
    const response = await axios.get(`${BASE_URL}/models`, {
      headers: getHeaders(),
      timeout: 30000
    });
    
    const data = response.data;
    const models = Array.isArray(data) ? data : (data.data || []);
    
    // Filter valid models
    cachedModels = models.filter(m => 
      typeof m === 'object' && 
      typeof m.id === 'string' &&
      m.id.length > 0
    );
    
    // Categorize models by capability
    modelsByCapability.vision = cachedModels.filter(isVisionModel);
    modelsByCapability.reasoning = cachedModels.filter(isReasoningModel);
    modelsByCapability.default = cachedModels;
    
    console.log(`✅ Loaded ${cachedModels.length} models from OpenRouter`);
    console.log(`   📷 Vision models: ${modelsByCapability.vision.length}`);
    console.log(`   🧠 Reasoning models: ${modelsByCapability.reasoning.length}`);
    
    // Log selected primary models
    const visionPrimary = pickModels('vision');
    const reasoningPrimary = pickModels('reasoning');
    
    console.log(`   🎯 Primary vision model: ${visionPrimary.primary}`);
    console.log(`   🎯 Primary reasoning model: ${reasoningPrimary.primary}`);
    
    return cachedModels;
  } catch (error) {
    console.error('❌ Failed to fetch OpenRouter models:', error.message);
    // Use fallback defaults
    cachedModels = [];
    return cachedModels;
  }
}

/**
 * Preferred models - stable, well-tested models to prioritize
 */
const PREFERRED_MODELS = {
  vision: [
    'anthropic/claude-3.5-sonnet',
    'anthropic/claude-3.5-sonnet-20241022',
    'openai/gpt-4o',
    'google/gemini-pro-1.5',
    'anthropic/claude-3-sonnet-20240229'
  ],
  reasoning: [
    'anthropic/claude-sonnet-4',
    'anthropic/claude-3.5-sonnet',
    'openai/o1',
    'openai/o1-preview',
    'deepseek/deepseek-r1',
    'anthropic/claude-3-opus-20240229'
  ],
  default: [
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o-mini',
    'google/gemini-flash-1.5',
    'anthropic/claude-3-haiku-20240307'
  ]
};

/**
 * Pick primary model and fallbacks for a given mode
 * Prioritizes stable, well-tested models over newest ones
 */
function pickModels(mode) {
  const modelIds = new Set(cachedModels?.map(m => m.id) || []);
  
  // Default fallbacks by mode
  const defaults = {
    vision: {
      primary: 'anthropic/claude-3.5-sonnet',
      fallbacks: ['anthropic/claude-3-sonnet-20240229', 'google/gemini-pro-1.5']
    },
    reasoning: {
      primary: 'anthropic/claude-sonnet-4',
      fallbacks: ['openai/o1', 'deepseek/deepseek-r1']
    },
    default: {
      primary: 'anthropic/claude-3.5-sonnet',
      fallbacks: ['openai/gpt-4o-mini', 'google/gemini-flash-1.5']
    }
  };
  
  // Check for pinned models first
  let pinnedModel = null;
  if (mode === 'vision' && PIN_VISION_MODEL) pinnedModel = PIN_VISION_MODEL;
  if (mode === 'reasoning' && PIN_REASONING_MODEL) pinnedModel = PIN_REASONING_MODEL;
  if (mode === 'default' && PIN_DEFAULT_MODEL) pinnedModel = PIN_DEFAULT_MODEL;
  
  // If pinned model exists in available models, use it
  if (pinnedModel && modelIds.has(pinnedModel)) {
    const fallbacks = PREFERRED_MODELS[mode]
      .filter(id => id !== pinnedModel && modelIds.has(id))
      .slice(0, 2);
    
    return {
      primary: pinnedModel,
      fallbacks: fallbacks.length > 0 ? fallbacks : defaults[mode].fallbacks.filter(id => modelIds.has(id))
    };
  }
  
  // Find the first preferred model that's available
  const preferredList = PREFERRED_MODELS[mode] || [];
  const availablePreferred = preferredList.filter(id => modelIds.has(id));
  
  if (availablePreferred.length > 0) {
    return {
      primary: availablePreferred[0],
      fallbacks: availablePreferred.slice(1, 3)
    };
  }
  
  // Fall back to auto-detected pool
  const pool = modelsByCapability[mode] || [];
  if (pool.length > 0) {
    const primary = pool[0].id;
    const fallbacks = pool.slice(1, 3).map(m => m.id);
    return { primary, fallbacks };
  }
  
  // Last resort: use hardcoded defaults
  return defaults[mode];
}

/**
 * Vision Chat - for OCR and image analysis
 * Uses vision-capable models (claude-3.5-sonnet, gpt-4o, gemini-pro-vision)
 */
export async function visionChat(messages, options = {}) {
  mustHaveKey();
  
  // Ensure models are loaded
  if (!cachedModels) {
    await initOpenRouterModels();
  }
  
  const { primary, fallbacks } = pickModels('vision');
  const allModels = [primary, ...fallbacks];
  
  const body = {
    model: primary,
    models: allModels,
    messages,
    temperature: options.temperature ?? 0.1,
    max_tokens: options.maxTokens ?? 4096
  };
  
  console.log(`🧠 Vision request using: ${primary} (fallbacks: ${fallbacks.join(', ')})`);
  
  return withRetry(async () => {
    const response = await axios.post(`${BASE_URL}/chat/completions`, body, {
      headers: getHeaders(),
      timeout: 120000
    });
    
    const content = response.data.choices?.[0]?.message?.content || '';
    const usage = response.data.usage || {};
    const modelUsed = response.data.model || primary;
    
    return {
      content,
      model: modelUsed,
      usage: {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0
      }
    };
  });
}

/**
 * Reasoning Chat - for complex analysis requiring deep thinking
 * Uses reasoning models with reasoning.effort: high
 */
export async function reasoningChat(messages, options = {}) {
  mustHaveKey();
  
  // Ensure models are loaded
  if (!cachedModels) {
    await initOpenRouterModels();
  }
  
  const { primary, fallbacks } = pickModels('reasoning');
  const allModels = [primary, ...fallbacks];
  
  const body = {
    model: primary,
    models: allModels,
    messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: options.maxTokens ?? 8192,
    // Enable reasoning for supported models
    reasoning: {
      effort: 'high'
    }
  };
  
  console.log(`🧠 Reasoning request using: ${primary} (fallbacks: ${fallbacks.join(', ')})`);
  
  return withRetry(async () => {
    const response = await axios.post(`${BASE_URL}/chat/completions`, body, {
      headers: getHeaders(),
      timeout: 180000 // Reasoning may take longer
    });
    
    const content = response.data.choices?.[0]?.message?.content || '';
    const usage = response.data.usage || {};
    const modelUsed = response.data.model || primary;
    
    return {
      content,
      model: modelUsed,
      reasoning: response.data.choices?.[0]?.message?.reasoning || null,
      usage: {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0
      }
    };
  });
}

/**
 * Default Chat - for general text completion
 */
export async function chat(messages, options = {}) {
  mustHaveKey();
  
  // Ensure models are loaded
  if (!cachedModels) {
    await initOpenRouterModels();
  }
  
  const { primary, fallbacks } = pickModels('default');
  const allModels = [primary, ...fallbacks];
  
  const body = {
    model: primary,
    models: allModels,
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 4096
  };
  
  return withRetry(async () => {
    const response = await axios.post(`${BASE_URL}/chat/completions`, body, {
      headers: getHeaders(),
      timeout: 60000
    });
    
    const content = response.data.choices?.[0]?.message?.content || '';
    const usage = response.data.usage || {};
    
    return {
      content,
      model: response.data.model || primary,
      usage: {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0
      }
    };
  });
}

/**
 * Get current model configuration (for system status panel)
 */
export function getModelConfig() {
  const vision = pickModels('vision');
  const reasoning = pickModels('reasoning');
  const defaultModel = pickModels('default');
  
  return {
    totalModels: cachedModels?.length || 0,
    visionModels: modelsByCapability.vision.length,
    reasoningModels: modelsByCapability.reasoning.length,
    selected: {
      vision: { primary: vision.primary, fallbacks: vision.fallbacks },
      reasoning: { primary: reasoning.primary, fallbacks: reasoning.fallbacks },
      default: { primary: defaultModel.primary, fallbacks: defaultModel.fallbacks }
    }
  };
}

export default {
  initOpenRouterModels,
  visionChat,
  reasoningChat,
  chat,
  getModelConfig
};

