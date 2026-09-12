import { describe, it, expect } from 'vitest';
import { ModelRouter } from '@luma/models';
import { ModelProviderType } from '@luma/shared';

describe('ModelRouter', () => {
  it('should start with no providers', () => {
    const router = new ModelRouter();
    expect(router.getAvailableProviders().length).toBe(0);
  });

  it('should register providers', () => {
    const router = new ModelRouter();
    router.registerProvider({
      type: ModelProviderType.OPENAI,
      apiKey: 'sk-test-key-12345678901234567890',
      enabled: true,
    });

    expect(router.getAvailableProviders().length).toBe(1);
  });

  it('should not register providers without API key', () => {
    const router = new ModelRouter();
    router.registerProvider({
      type: ModelProviderType.OPENAI,
      apiKey: '',
      enabled: true,
    });

    expect(router.getAvailableProviders().length).toBe(0);
  });

  it('should not register disabled providers', () => {
    const router = new ModelRouter();
    router.registerProvider({
      type: ModelProviderType.OPENAI,
      apiKey: 'sk-test-key-12345678901234567890',
      enabled: false,
    });

    expect(router.getAvailableProviders().length).toBe(0);
  });

  it('should set default provider', () => {
    const router = new ModelRouter();
    router.registerProvider({
      type: ModelProviderType.OPENAI,
      apiKey: 'sk-test-key-12345678901234567890',
      enabled: true,
    });

    router.setDefault(ModelProviderType.OPENAI);
    const provider = router.getProvider();
    expect(provider).toBeDefined();
    expect(provider?.name).toBe('OpenAI');
  });

  it('should auto-route based on capabilities', () => {
    const router = new ModelRouter();
    router.registerProvider({
      type: ModelProviderType.OPENAI,
      apiKey: 'sk-test-key-12345678901234567890',
      enabled: true,
    });

    const provider = router.autoRoute({ needsVision: true });
    expect(provider).toBeDefined();
  });

  it('should return undefined for no providers', () => {
    const router = new ModelRouter();
    const provider = router.autoRoute({});
    expect(provider).toBeUndefined();
  });
});
