import { useState, useEffect, useMemo } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, Zap, Leaf, Target, Check, Palette, AlertCircle } from 'lucide-react';
import { SalonStyle, ButtonEmphasis, SalonAppearance, CustomColors, ThemePreset } from '@/types/salon';
import { toast } from '@/hooks/use-toast';

// Paletas base por estilo
const STYLE_PALETTES: Record<SalonStyle, { primary: string; secondary: string; support: string; description: string }> = {
  luxo: {
    primary: '45 80% 45%',
    secondary: '30 15% 20%',
    support: '45 60% 70%',
    description: 'Cores sofisticadas com dourado e tons escuros'
  },
  delicado: {
    primary: '340 60% 70%',
    secondary: '280 40% 85%',
    support: '20 50% 90%',
    description: 'Tons pastéis e românticos'
  },
  moderno: {
    primary: '220 80% 55%',
    secondary: '260 70% 60%',
    support: '180 60% 50%',
    description: 'Cores vibrantes e contemporâneas'
  },
  natural: {
    primary: '140 50% 40%',
    secondary: '30 40% 60%',
    support: '80 40% 50%',
    description: 'Tons terrosos e orgânicos'
  },
  impactante: {
    primary: '0 80% 50%',
    secondary: '280 100% 40%',
    support: '30 100% 50%',
    description: 'Cores fortes e marcantes'
  }
};

const STYLE_OPTIONS: { value: SalonStyle; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'luxo', label: 'Luxo', icon: <Crown className="w-5 h-5" />, description: 'Elegante e sofisticado' },
  { value: 'delicado', label: 'Delicado', icon: <Sparkles className="w-5 h-5" />, description: 'Suave e feminino' },
  { value: 'moderno', label: 'Moderno', icon: <Zap className="w-5 h-5" />, description: 'Atual e vibrante' },
  { value: 'natural', label: 'Natural', icon: <Leaf className="w-5 h-5" />, description: 'Orgânico e acolhedor' },
  { value: 'impactante', label: 'Impactante', icon: <Target className="w-5 h-5" />, description: 'Forte e marcante' },
];

const EMPHASIS_OPTIONS: { value: ButtonEmphasis; label: string; description: string }[] = [
  { value: 'discreto', label: 'Discreto', description: 'Botões sutis e elegantes' },
  { value: 'equilibrado', label: 'Equilibrado', description: 'Visíveis mas não exagerados' },
  { value: 'chamativo', label: 'Chamativo', description: 'Máximo destaque para conversão' },
];

// Default appearance
const DEFAULT_APPEARANCE: SalonAppearance = {
  style: 'moderno',
  colorMode: 'no_colors',
  colorCount: 1,
  primaryColor: '220 80% 55%',
  secondaryColor: '260 70% 60%',
  supportColor: '180 60% 50%',
  buttonEmphasis: 'equilibrado'
};

interface ThemeSelectorProps {
  savedAppearance?: SalonAppearance | null;
  onApply: (appearance: SalonAppearance) => void;
  hasUnappliedChanges?: boolean;
}

// Funções auxiliares de cor
const hslToHex = (hsl: string): string => {
  try {
    const [h, s, l] = hsl.split(' ').map((v, i) => {
      if (i === 0) return parseFloat(v);
      return parseFloat(v.replace('%', '')) / 100;
    });
    
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  } catch {
    return '#8b5cf6';
  }
};

const hexToHsl = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '280 60% 50%';
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const getLuminance = (hsl: string): number => {
  try {
    const parts = hsl.split(' ');
    return parseFloat(parts[2]?.replace('%', '') || '50');
  } catch {
    return 50;
  }
};

const adjustBrightness = (hsl: string, amount: number): string => {
  try {
    const parts = hsl.split(' ');
    const h = parts[0];
    const s = parts[1];
    const l = Math.max(0, Math.min(100, parseFloat(parts[2].replace('%', '')) + amount));
    return `${h} ${s} ${l}%`;
  } catch {
    return hsl;
  }
};

// Cores calculadas para preview
export interface ComputedColors {
  buttonBackground: string;
  buttonText: string;
  gradientStart: string;
  gradientEnd: string;
  accent: string;
}

// Calcula cores finais baseado nas configurações
export const computeColors = (appearance: SalonAppearance): ComputedColors => {
  const { style, colorMode, primaryColor, secondaryColor, buttonEmphasis } = appearance;
  
  const basePrimary = colorMode === 'no_colors' ? STYLE_PALETTES[style].primary : primaryColor;
  const baseSecondary = colorMode === 'no_colors' ? STYLE_PALETTES[style].secondary : secondaryColor;
  
  let buttonBg = basePrimary;
  let buttonTextColor = '0 0% 100%';
  
  if (buttonEmphasis === 'discreto') {
    buttonBg = adjustBrightness(basePrimary, 10);
  } else if (buttonEmphasis === 'chamativo') {
    const parts = basePrimary.split(' ');
    const h = parts[0];
    const s = Math.min(100, parseFloat(parts[1]?.replace('%', '') || '60') + 20);
    const l = parts[2];
    buttonBg = `${h} ${s}% ${l}`;
  }
  
  const luminance = getLuminance(buttonBg);
  buttonTextColor = luminance > 55 ? '0 0% 10%' : '0 0% 100%';
  
  const gradientStart = adjustBrightness(baseSecondary, 15);
  const gradientEnd = adjustBrightness(basePrimary, -10);
  
  return {
    buttonBackground: buttonBg,
    buttonText: buttonTextColor,
    gradientStart,
    gradientEnd,
    accent: basePrimary
  };
};

// Converte appearance para CustomColors (compatibilidade)
export const appearanceToCustomColors = (appearance: SalonAppearance): CustomColors => {
  const computed = computeColors(appearance);
  return {
    primary: computed.buttonBackground,
    primaryForeground: computed.buttonText,
    secondary: computed.gradientStart,
    accent: computed.gradientEnd
  };
};

// Compare two appearances
const appearancesEqual = (a: SalonAppearance, b: SalonAppearance): boolean => {
  return (
    a.style === b.style &&
    a.colorMode === b.colorMode &&
    a.colorCount === b.colorCount &&
    a.primaryColor === b.primaryColor &&
    a.secondaryColor === b.secondaryColor &&
    a.supportColor === b.supportColor &&
    a.buttonEmphasis === b.buttonEmphasis
  );
};

export function ThemeSelector({
  savedAppearance,
  onApply,
}: ThemeSelectorProps) {
  const [step, setStep] = useState<'style' | 'colors' | 'emphasis'>('style');
  
  // Draft state - used for editing/preview
  const [draft, setDraft] = useState<SalonAppearance>(() => {
    return savedAppearance || DEFAULT_APPEARANCE;
  });

  // Sync draft with saved when savedAppearance changes (e.g., on load)
  useEffect(() => {
    if (savedAppearance) {
      setDraft(savedAppearance);
    }
  }, [savedAppearance]);

  // Check if draft differs from saved
  const hasChanges = useMemo(() => {
    if (!savedAppearance) return true;
    return !appearancesEqual(draft, savedAppearance);
  }, [draft, savedAppearance]);

  // Computed colors for preview (always uses draft)
  const computedColors = useMemo(() => computeColors(draft), [draft]);

  const updateDraft = (updates: Partial<SalonAppearance>) => {
    setDraft(prev => ({ ...prev, ...updates }));
  };

  const handleStyleChange = (style: SalonStyle) => {
    const palette = STYLE_PALETTES[style];
    updateDraft({
      style,
      primaryColor: draft.colorMode === 'no_colors' ? palette.primary : draft.primaryColor,
      secondaryColor: draft.colorMode === 'no_colors' ? palette.secondary : draft.secondaryColor,
      supportColor: draft.colorMode === 'no_colors' ? palette.support : draft.supportColor,
    });
  };

  const handleColorModeChange = (mode: 'has_colors' | 'no_colors') => {
    const palette = STYLE_PALETTES[draft.style];
    updateDraft({
      colorMode: mode,
      primaryColor: mode === 'no_colors' ? palette.primary : draft.primaryColor,
      secondaryColor: mode === 'no_colors' ? palette.secondary : draft.secondaryColor,
    });
  };

  const handleApply = () => {
    onApply(draft);
    toast({
      title: 'Tema aplicado!',
      description: 'Clique em "Salvar" para persistir as alterações.',
    });
  };

  // Preview Component
  const Preview = () => (
    <div className="relative rounded-xl overflow-hidden border border-border shadow-lg">
      <div 
        className="h-40 relative"
        style={{ 
          background: `linear-gradient(135deg, hsl(${computedColors.gradientStart}), hsl(${computedColors.gradientEnd}))`
        }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          <div className="text-center mb-4">
            <div className="w-12 h-12 rounded-full bg-white/20 mx-auto mb-2" />
            <p className="text-white/90 text-sm font-medium">Seu Salão</p>
            <p className="text-white/70 text-xs">Agende seu horário</p>
          </div>
          
          <button
            className="px-6 py-2.5 rounded-full text-sm font-medium transition-all shadow-lg"
            style={{ 
              backgroundColor: `hsl(${computedColors.buttonBackground})`,
              color: `hsl(${computedColors.buttonText})`
            }}
          >
            Agendar Agora
          </button>
        </div>
      </div>
      
      <div className="bg-background p-3 border-t border-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Preview em tempo real</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${computedColors.buttonBackground})` }} />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${computedColors.gradientStart})` }} />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${computedColors.gradientEnd})` }} />
          </div>
        </div>
      </div>
    </div>
  );

  // Step indicator
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {['style', 'colors', 'emphasis'].map((s, i) => (
        <button
          key={s}
          type="button"
          onClick={() => setStep(s as typeof step)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            step === s 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-background/20 flex items-center justify-center text-xs">
            {i + 1}
          </span>
          {s === 'style' && 'Estilo'}
          {s === 'colors' && 'Cores'}
          {s === 'emphasis' && 'Botões'}
        </button>
      ))}
    </div>
  );

  // Color picker inline
  const ColorInput = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <div 
          className="w-8 h-8 rounded-lg border border-border shadow-inner flex-shrink-0"
          style={{ backgroundColor: `hsl(${value})` }}
        />
        <Input
          type="color"
          value={hslToHex(value)}
          onChange={(e) => onChange(hexToHsl(e.target.value))}
          className="w-full h-8 cursor-pointer"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <StepIndicator />
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Options */}
        <div className="space-y-6">
          {/* Step 1: Style */}
          {step === 'style' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-foreground mb-1">Qual estilo combina com seu salão?</h3>
                <p className="text-sm text-muted-foreground">Isso define a personalidade visual da sua página</p>
              </div>
              
              <RadioGroup 
                value={draft.style} 
                onValueChange={(v) => handleStyleChange(v as SalonStyle)}
                className="grid gap-3"
              >
                {STYLE_OPTIONS.map((option) => (
                  <Label
                    key={option.value}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      draft.style === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={option.value} className="sr-only" />
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      draft.style === option.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                    {draft.style === option.value && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </Label>
                ))}
              </RadioGroup>
              
              <button
                type="button"
                onClick={() => setStep('colors')}
                className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all"
              >
                Continuar
              </button>
            </div>
          )}

          {/* Step 2: Colors */}
          {step === 'colors' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-foreground mb-1">Seu salão já tem cores definidas?</h3>
                <p className="text-sm text-muted-foreground">Podemos usar suas cores ou criar uma paleta para você</p>
              </div>
              
              <RadioGroup 
                value={draft.colorMode} 
                onValueChange={(v) => handleColorModeChange(v as 'has_colors' | 'no_colors')}
                className="grid gap-3"
              >
                <Label
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    draft.colorMode === 'has_colors'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value="has_colors" className="sr-only" />
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    draft.colorMode === 'has_colors'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <Palette className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Já tenho cores</p>
                    <p className="text-sm text-muted-foreground">Vou informar as cores do meu salão</p>
                  </div>
                  {draft.colorMode === 'has_colors' && <Check className="w-5 h-5 text-primary" />}
                </Label>
                
                <Label
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    draft.colorMode === 'no_colors'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value="no_colors" className="sr-only" />
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    draft.colorMode === 'no_colors'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Não tenho cores</p>
                    <p className="text-sm text-muted-foreground">Criar paleta automática baseada no estilo "{STYLE_OPTIONS.find(s => s.value === draft.style)?.label}"</p>
                  </div>
                  {draft.colorMode === 'no_colors' && <Check className="w-5 h-5 text-primary" />}
                </Label>
              </RadioGroup>

              {/* Color pickers when has_colors */}
              {draft.colorMode === 'has_colors' && (
                <div className="space-y-4 p-4 rounded-xl bg-muted/50">
                  <div>
                    <Label className="text-sm mb-2 block">Quantas cores você usa?</Label>
                    <div className="flex gap-2">
                      {([1, 2, 3] as const).map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => updateDraft({ colorCount: num })}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            draft.colorCount === num
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-background border border-border hover:border-primary/50'
                          }`}
                        >
                          {num} {num === 1 ? 'cor' : 'cores'}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <ColorInput 
                    label="Cor principal" 
                    value={draft.primaryColor}
                    onChange={(v) => updateDraft({ primaryColor: v })}
                  />
                  
                  {draft.colorCount >= 2 && (
                    <ColorInput 
                      label="Cor secundária" 
                      value={draft.secondaryColor}
                      onChange={(v) => updateDraft({ secondaryColor: v })}
                    />
                  )}
                  
                  {draft.colorCount >= 3 && (
                    <ColorInput 
                      label="Cor de apoio" 
                      value={draft.supportColor}
                      onChange={(v) => updateDraft({ supportColor: v })}
                    />
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('style')}
                  className="flex-1 py-2.5 px-4 border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-all"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setStep('emphasis')}
                  className="flex-1 py-2.5 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Button Emphasis */}
          {step === 'emphasis' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-foreground mb-1">O quanto você quer que os botões chamem atenção?</h3>
                <p className="text-sm text-muted-foreground">Isso afeta a visibilidade do botão de agendamento</p>
              </div>
              
              <RadioGroup 
                value={draft.buttonEmphasis} 
                onValueChange={(v) => updateDraft({ buttonEmphasis: v as ButtonEmphasis })}
                className="grid gap-3"
              >
                {EMPHASIS_OPTIONS.map((option) => (
                  <Label
                    key={option.value}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      draft.buttonEmphasis === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={option.value} className="sr-only" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                    {draft.buttonEmphasis === option.value && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </Label>
                ))}
              </RadioGroup>
              
              <button
                type="button"
                onClick={() => setStep('colors')}
                className="w-full py-2.5 px-4 border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-all"
              >
                Voltar
              </button>
            </div>
          )}
        </div>

        {/* Right: Preview + Apply button */}
        <div className="space-y-4">
          <h3 className="font-medium text-foreground">Preview da página</h3>
          <Preview />
          
          {/* Color summary */}
          <div className="p-4 rounded-xl bg-muted/50 space-y-3">
            <p className="text-sm font-medium text-foreground">Cores do preview:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: `hsl(${computedColors.buttonBackground})` }} />
                <span className="text-muted-foreground">Botão</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: `hsl(${computedColors.buttonText})` }} />
                <span className="text-muted-foreground">Texto do botão</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: `hsl(${computedColors.gradientStart})` }} />
                <span className="text-muted-foreground">Fundo (início)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: `hsl(${computedColors.gradientEnd})` }} />
                <span className="text-muted-foreground">Fundo (fim)</span>
              </div>
            </div>
          </div>

          {/* Apply button */}
          <div className="space-y-2">
            {hasChanges && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-amber-600 dark:text-amber-400">Alterações não aplicadas</span>
              </div>
            )}
            <Button
              type="button"
              onClick={handleApply}
              disabled={!hasChanges}
              variant="gradient"
              className="w-full"
            >
              {hasChanges ? 'Aplicar Tema' : 'Tema Aplicado'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Clique em "Aplicar" para ver o tema na página, depois em "Salvar" para persistir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export for external usage
export { DEFAULT_APPEARANCE };

// Exportar função para compatibilidade
export function getThemeCSS(theme: ThemePreset, customColors?: CustomColors): Record<string, string> {
  const themes = {
    purple: {
      '--primary': '270 70% 50%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '330 80% 60%',
      '--gradient-primary': 'linear-gradient(135deg, hsl(280, 60%, 55%), hsl(330, 80%, 60%))',
    },
    rose: {
      '--primary': '350 80% 55%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '350 70% 70%',
      '--gradient-primary': 'linear-gradient(135deg, hsl(340, 75%, 60%), hsl(350, 70%, 70%))',
    },
    gold: {
      '--primary': '45 90% 40%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '45 90% 55%',
      '--gradient-primary': 'linear-gradient(135deg, hsl(40, 85%, 50%), hsl(50, 90%, 60%))',
    },
    custom: customColors ? {
      '--primary': customColors.primary,
      '--primary-foreground': customColors.primaryForeground || '0 0% 100%',
      '--accent': customColors.accent,
      '--gradient-primary': `linear-gradient(135deg, hsl(${customColors.secondary}), hsl(${customColors.accent}))`,
    } : {
      '--primary': '280 60% 50%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '340 80% 65%',
      '--gradient-primary': 'linear-gradient(135deg, hsl(280, 60%, 55%), hsl(340, 80%, 65%))',
    },
  };
  return themes[theme];
}
