import { ThemePreset, CustomColors } from '@/types/salon';
import { cn } from '@/lib/utils';
import { Check, Palette } from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import { Card } from '@/components/ui/card';

interface ThemeSelectorProps {
  currentTheme: ThemePreset;
  customColors: CustomColors;
  onThemeChange: (theme: ThemePreset) => void;
  onCustomColorsChange: (colors: CustomColors) => void;
}

const presetThemes: { id: ThemePreset; name: string; gradient: string; colors: string[] }[] = [
  {
    id: 'purple',
    name: 'Roxo Elegante',
    gradient: 'linear-gradient(135deg, #9333ea, #ec4899)',
    colors: ['#9333ea', '#a855f7', '#ec4899'],
  },
  {
    id: 'rose',
    name: 'Rosa Delicado',
    gradient: 'linear-gradient(135deg, #f43f5e, #fb7185)',
    colors: ['#f43f5e', '#fb7185', '#fda4af'],
  },
  {
    id: 'gold',
    name: 'Dourado Luxo',
    gradient: 'linear-gradient(135deg, #ca8a04, #fbbf24)',
    colors: ['#ca8a04', '#eab308', '#fbbf24'],
  },
];

export function ThemeSelector({ currentTheme, customColors, onThemeChange, onCustomColorsChange }: ThemeSelectorProps) {
  const isCustom = currentTheme === 'custom';

  return (
    <div className="space-y-6">
      <p className="text-sm font-medium text-muted-foreground">Escolha um tema visual ou crie o seu</p>
      
      {/* Preset Themes */}
      <div className="grid grid-cols-3 gap-4">
        {presetThemes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => onThemeChange(theme.id)}
            className={cn(
              'relative p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105',
              currentTheme === theme.id
                ? 'border-primary shadow-lg'
                : 'border-border hover:border-primary/50'
            )}
          >
            {currentTheme === theme.id && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <div
              className="h-16 rounded-lg mb-3"
              style={{ background: theme.gradient }}
            />
            <p className="text-sm font-medium text-foreground">{theme.name}</p>
            <div className="flex gap-1 mt-2 justify-center">
              {theme.colors.map((color, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full border border-border"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Custom Theme Option */}
      <Card className={cn(
        "p-4 border-2 transition-all duration-200",
        isCustom ? "border-primary shadow-lg" : "border-border"
      )}>
        <button
          type="button"
          onClick={() => onThemeChange('custom')}
          className="w-full flex items-center gap-3 mb-4"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Palette className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-foreground">Cores Personalizadas</p>
            <p className="text-xs text-muted-foreground">Escolha suas próprias 3 cores</p>
          </div>
          {isCustom && (
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
        </button>

        {isCustom && (
          <div className="space-y-4 pt-4 border-t border-border">
            <ColorPicker
              label="Cor Principal"
              value={customColors.primary}
              onChange={(value) => onCustomColorsChange({ ...customColors, primary: value })}
              description="Botões, títulos e destaques (cor sólida)"
            />
            <ColorPicker
              label="Cor do Degradê 1"
              value={customColors.secondary}
              onChange={(value) => onCustomColorsChange({ ...customColors, secondary: value })}
              description="Início do degradê"
            />
            <ColorPicker
              label="Cor do Degradê 2"
              value={customColors.accent}
              onChange={(value) => onCustomColorsChange({ ...customColors, accent: value })}
              description="Fim do degradê"
            />
            
            {/* Preview */}
            <div className="pt-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Cor Principal (botões):</p>
                <div
                  className="h-10 rounded-lg"
                  style={{ backgroundColor: `hsl(${customColors.primary})` }}
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Degradê (fundos e efeitos):</p>
                <div
                  className="h-10 rounded-lg"
                  style={{
                    background: `linear-gradient(135deg, hsl(${customColors.secondary}) 0%, hsl(${customColors.accent}) 100%)`
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export function getThemeCSS(theme: ThemePreset, customColors?: CustomColors): Record<string, string> {
  // Primary = solid color for buttons/titles/highlights
  // Gradient = secondary to accent (2 colors only)
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
      '--primary-foreground': '0 0% 100%',
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
