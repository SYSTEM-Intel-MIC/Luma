import type { ProviderConfig, ModelCapabilities } from '@luma/shared';
import { ModelProviderType } from '@luma/shared';
import { ModelProvider } from './provider.js';
import { OpenAIProvider } from './providers/openai.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { GoogleProvider } from './providers/google.js';
import { DeepSeekProvider } from './providers/deepseek.js';
import { OpenRouterProvider } from './providers/openrouter.js';

/** Model router — manages providers and routes requests */
export class ModelRouter {
  private providers: Map<ModelProviderType, ModelProvider> = new Map();
  private defaultProvider: ModelProviderType | null = null;

  /** Register a provider */
  registerProvider(config: ProviderConfig): void {
    const provider = this.createProvider(config);
    if (provider.isReady()) {
      this.providers.set(config.type, provider);
    }
    if (!this.defaultProvider && provider.isReady()) {
      this.defaultProvider = config.type;
    }
  }

  /** Set default provider */
  setDefault(type: ModelProviderType): void {
    if (this.providers.has(type)) {
      this.defaultProvider = type;
    }
  }

  /** Get a provider by type */
  getProvider(type?: ModelProviderType): ModelProvider | undefined {
    if (type) return this.providers.get(type);
    if (this.defaultProvider) return this.providers.get(this.defaultProvider);
    return this.providers.values().next().value;
  }

  /** Get all available providers */
  getAvailableProviders(): ModelProvider[] {
    return Array.from(this.providers.values());
  }

  /** Auto-route based on task complexity */
  autoRoute(options: {
    needsVision?: boolean;
    needsToolCalling?: boolean;
    needsReasoning?: boolean;
    complexity?: 'low' | 'medium' | 'high';
  }): ModelProvider | undefined {
    const providers = this.getAvailableProviders();
    if (providers.length === 0) return undefined;

    // Filter by required capabilities
    let candidates = providers.filter((p) => {
      if (options.needsVision && !p.capabilities.supportsVision) return false;
      if (options.needsToolCalling && !p.capabilities.supportsToolCalling) return false;
      if (options.needsReasoning && !p.capabilities.supportsReasoning) return false;
      return true;
    });

    if (candidates.length === 0) candidates = providers;

    // Prefer default provider
    if (this.defaultProvider) {
      const defaultProv = candidates.find((p) =>
        this.providers.get(this.defaultProvider!) === p
      );
      if (defaultProv) return defaultProv;
    }

    return candidates[0];
  }

  /** Create provider instance from config */
  private createProvider(config: ProviderConfig): ModelProvider {
    switch (config.type) {
      case ModelProviderType.OPENAI:
      case ModelProviderType.CUSTOM:
        return new OpenAIProvider(config);
      case ModelProviderType.ANTHROPIC:
        return new AnthropicProvider(config);
      case ModelProviderType.GOOGLE:
        return new GoogleProvider(config);
      case ModelProviderType.DEEPSEEK:
        return new DeepSeekProvider(config);
      case ModelProviderType.OPENROUTER:
        return new OpenRouterProvider(config);
      default:
        return new OpenAIProvider(config);
    }
  }
}
