import { useState, useMemo } from 'react';
import { ThemePreset, CustomColors } from '@/types/salon';
import { cn } from '@/lib/utils';
import { Check, AlertTriangle } from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ThemeSelectorProps {
  currentTheme: ThemePreset;
  customColors: CustomColors;
  onThemeChange: (theme: ThemePreset) => void;
  onCustomColorsChange: (colors: CustomColors) => void;
}

const presetThemes: { id: ThemePreset; name: string; buttonColor: string; buttonTextColor: string; gradientStart: string; gradientEnd: string }[] = [
  {
    id: 'purple',
    name: 'Roxo Elegante',
    buttonColor: '270 70% 50%',
    buttonTextColor: '0 0% 100%',
    gradientStart: '280 60% 55%',
    gradientEnd: '330 80% 60%',
  },
  {
    id: 'rose',
    name: 'Rosa Delicado',
    buttonColor: '350 80% 55%',
    buttonTextColor: '0 0% 100%',
    gradientStart: '340 75% 60%',
    gradientEnd: '350 70% 70%',
  },
  {
    id: 'gold',
    name: 'Dourado Luxo',
    buttonColor: '45 90% 40%',
    buttonTextColor: '0 0% 100%',
    gradientStart: '40 85% 50%',
    gradientEnd: '50 90% 60%',
  },
];

// Calcula a luminosidade de uma cor HSL
function getLuminance(hsl: string): number {
  try {
    const parts = hsl.split(' ');
    const l = parseFloat(parts[2]?.replace('%', '') || '50');
    return l;
  } catch {
    return 50;
  }
}

// Verifica se o contraste é adequado
function hasGoodContrast(bgHsl: string, textHsl: string): boolean {
  const bgL = getLuminance(bgHsl);
  const textL = getLuminance(textHsl);
  const diff = Math.abs(bgL - textL);
  return diff >= 40; // Diferença mínima de 40% para boa legibilidade
}

// Sugere cor de texto baseado na cor de fundo
function getAutoTextColor(bgHsl: string): string {
  const luminance = getLuminance(bgHsl);
  return luminance > 55 ? '0 0% 10%' : '0 0% 100%';
}

export function ThemeSelector({ currentTheme, customColors, onThemeChange, onCustomColorsChange }: ThemeSelectorProps) {
  const isCustom = currentTheme === 'custom';
  const [useAutoTextColor, setUseAutoTextColor] = useState(true);

  // Cor do texto atual (automática ou manual)
  const effectiveTextColor = useMemo(() => {
    if (useAutoTextColor || !customColors.primaryForeground) {
      return getAutoTextColor(customColors.primary);
    }
    return customColors.primaryForeground;
  }, [customColors.primary, customColors.primaryForeground, useAutoTextColor]);

  // Verifica contraste
  const contrastWarning = useMemo(() => {
    if (!isCustom) return false;
    return !hasGoodContrast(customColors.primary, effectiveTextColor);
  }, [customColors.primary, effectiveTextColor, isCustom]);

  const handleColorChange = (field: keyof CustomColors, value: string) => {
    const newColors = { ...customColors, [field]: value };
    
    // Se mudou a cor do botão e está no modo automático, atualiza o texto
    if (field === 'primary' && useAutoTextColor) {
      newColors.primaryForeground = getAutoTextColor(value);
    }
    
    onCustomColorsChange(newColors);
  };

  const handleTextColorChange = (value: string) => {
    setUseAutoTextColor(false);
    onCustomColorsChange({ ...customColors, primaryForeground: value });
  };

  const handleAutoTextToggle = () => {
    setUseAutoTextColor(true);
    onCustomColorsChange({ 
      ...customColors, 
      primaryForeground: getAutoTextColor(customColors.primary) 
    });
  };

  return (
    <div className="space-y-6">
      <RadioGroup 
        value={isCustom ? 'custom' : 'preset'} 
        onValueChange={(v) => {
          if (v === 'custom') {
            onThemeChange('custom');
          }
        }}
        className="space-y-4"
      >
        {/* Opção: Tema Pronto */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="preset" id="preset" />
            <Label htmlFor="preset" className="font-medium cursor-pointer">
              Usar tema pronto
            </Label>
          </div>

          {!isCustom && (
            <div className="grid grid-cols-3 gap-3 ml-6">
              {presetThemes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => onThemeChange(theme.id)}
                  className={cn(
                    'relative p-3 rounded-xl border transition-all duration-200 hover:scale-[1.02]',
                    currentTheme === theme.id
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-muted-foreground/30'
                  )}
                >
                  {currentTheme === theme.id && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  
                  {/* Preview do tema */}
                  <div 
                    className="h-12 rounded-lg mb-2 flex items-center justify-center"
                    style={{ 
                      background: `linear-gradient(135deg, hsl(${theme.gradientStart}), hsl(${theme.gradientEnd}))` 
                    }}
                  >
                    <div 
                      className="px-3 py-1 rounded-md text-xs font-medium"
                      style={{ 
                        backgroundColor: `hsl(${theme.buttonColor})`,
                        color: `hsl(${theme.buttonTextColor})`
                      }}
                    >
                      Botão
                    </div>
                  </div>
                  <p className="text-xs font-medium text-foreground text-center">{theme.name}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Opção: Personalizar */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="custom" id="custom" />
            <Label htmlFor="custom" className="font-medium cursor-pointer">
              Personalizar cores
            </Label>
          </div>

          {isCustom && (
            <div className="ml-6 space-y-5">
              {/* Preview em tempo real */}
              <div className="rounded-xl overflow-hidden">
                <div 
                  className="p-6 flex flex-col items-center justify-center gap-3"
                  style={{ 
                    background: `linear-gradient(135deg, hsl(${customColors.secondary}), hsl(${customColors.accent}))`,
                    minHeight: '120px'
                  }}
                >
                  <p className="text-sm text-white/90 font-medium drop-shadow-sm">
                    Prévia da página do cliente
                  </p>
                  <button 
                    className="px-6 py-2.5 rounded-lg font-medium text-sm shadow-lg transition-transform hover:scale-105"
                    style={{ 
                      backgroundColor: `hsl(${customColors.primary})`,
                      color: `hsl(${effectiveTextColor})`
                    }}
                    type="button"
                  >
                    Agendar Agora
                  </button>
                </div>
              </div>

              {/* Aviso de contraste */}
              {contrastWarning && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Contraste baixo. Considere escolher cores mais distintas para melhor legibilidade.
                  </p>
                </div>
              )}

              {/* Seletores de cores */}
              <div className="grid gap-4">
                <ColorPicker
                  label="Cor do botão"
                  value={customColors.primary}
                  onChange={(value) => handleColorChange('primary', value)}
                />
                
                <div className="space-y-2">
                  <ColorPicker
                    label="Cor do texto do botão"
                    value={effectiveTextColor}
                    onChange={handleTextColorChange}
                  />
                  {!useAutoTextColor && (
                    <button 
                      type="button"
                      onClick={handleAutoTextToggle}
                      className="text-xs text-primary hover:underline"
                    >
                      Usar cor automática
                    </button>
                  )}
                </div>
                
                <ColorPicker
                  label="Cor do fundo (início)"
                  value={customColors.secondary}
                  onChange={(value) => handleColorChange('secondary', value)}
                />
                
                <ColorPicker
                  label="Cor do fundo (fim)"
                  value={customColors.accent}
                  onChange={(value) => handleColorChange('accent', value)}
                />
              </div>
            </div>
          )}
        </div>
      </RadioGroup>
    </div>
  );
}

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