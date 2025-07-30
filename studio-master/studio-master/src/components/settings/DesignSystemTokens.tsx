
"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Palette, RefreshCcw, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ColorToken {
  name: string;
  variableName: string;
  hslValue: string; // Original HSL string for display
  currentHex: string; // Current hex value for the color picker
  defaultHex: string; // Default hex value for reversion
  tailwindBgClass: string;
  tailwindTextClass?: string;
}

interface FontToken {
  name: string; // e.g., Body, Headline
  currentFont: string; // e.g., 'Inter', 'Roboto'
  defaultFont: string;
  tailwindVariable: string;
  options: { value: string; label: string; stack: string }[];
}

// Utility to convert HEX to HSL object {h, s, l}
function hexToHSL(hex: string): { h: number; s: number; l: number } | null {
  if (!hex) return null;
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  } else {
    return null; // Invalid hex
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}


const initialColorValues: Record<string, { name: string; variableName: string; hslValue: string; defaultHex: string; tailwindBgClass: string; tailwindTextClass?: string; }> = {
  background: { name: 'Background', variableName: '--background', hslValue: '150 11% 95%', defaultHex: '#F2F4F3', tailwindBgClass: 'bg-background', tailwindTextClass: 'text-foreground' },
  foreground: { name: 'Foreground', variableName: '--foreground', hslValue: '140 25% 25%', defaultHex: '#375943', tailwindBgClass: 'bg-foreground', tailwindTextClass: 'text-background' },
  primary: { name: 'Primary', variableName: '--primary', hslValue: '140 25% 38%', defaultHex: '#4A7C59', tailwindBgClass: 'bg-primary', tailwindTextClass: 'text-primary-foreground' },
  accent: { name: 'Accent', variableName: '--accent', hslValue: '23 55% 50%', defaultHex: '#C8723A', tailwindBgClass: 'bg-accent', tailwindTextClass: 'text-accent-foreground' },
};

const fontOptions = [
  { value: 'Inter', label: 'Inter (Default)', stack: "Inter, sans-serif" },
  { value: 'Roboto', label: 'Roboto', stack: "Roboto, sans-serif" },
  { value: 'Lato', label: 'Lato', stack: "Lato, sans-serif" },
  { value: 'Georgia', label: 'Georgia', stack: "Georgia, serif" },
  { value: 'Times New Roman', label: 'Times New Roman', stack: "'Times New Roman', serif" },
];

const initialFontValues: Record<string, { name: string; defaultFont: string; tailwindVariable: string }> = {
  body: { name: 'Body Font', defaultFont: 'Inter', tailwindVariable: '--font-body-family' },
  headline: { name: 'Headline Font', defaultFont: 'Inter', tailwindVariable: '--font-headline-family' },
};


export function DesignSystemTokens() {
  const { toast } = useToast();
  const [editableColors, setEditableColors] = React.useState<ColorToken[]>(
    Object.values(initialColorValues).map(c => ({ ...c, currentHex: c.defaultHex }))
  );
  const [editableFonts, setEditableFonts] = React.useState<FontToken[]>(
    Object.values(initialFontValues).map(f => ({ ...f, currentFont: f.defaultFont, options: fontOptions }))
  );

  React.useEffect(() => {
    editableColors.forEach(color => {
      const hsl = hexToHSL(color.currentHex);
      if (hsl) {
        document.documentElement.style.setProperty(color.variableName, `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      }
    });
  }, [editableColors]);

  React.useEffect(() => {
    editableFonts.forEach(font => {
      const selectedFontOption = font.options.find(opt => opt.value === font.currentFont);
      if (selectedFontOption) {
        document.documentElement.style.setProperty(font.tailwindVariable, selectedFontOption.stack);
      }
    });
  }, [editableFonts]);

  const handleColorChange = (variableName: string, newHex: string) => {
    setEditableColors(prevColors =>
      prevColors.map(c => (c.variableName === variableName ? { ...c, currentHex: newHex } : c))
    );
  };

  const handleFontChange = (fontNameKey: string, newFontValue: string) => {
    setEditableFonts(prevFonts =>
      prevFonts.map(f => (f.name === fontNameKey ? { ...f, currentFont: newFontValue } : f))
    );
  };

  const handleRevertToDefaults = () => {
    setEditableColors(Object.values(initialColorValues).map(c => ({ ...c, currentHex: c.defaultHex })));
    setEditableFonts(Object.values(initialFontValues).map(f => ({ ...f, currentFont: f.defaultFont, options: fontOptions })));
    toast({
      title: "Preview Reset to Defaults",
      description: "The live preview now shows the default theme. To make this permanent, ask the AI assistant to 'save the default theme'.",
      duration: 7000,
    });
  };

  const handleSaveChanges = () => {
    toast({
      title: "Theme Preview Finalized",
      description: "Your chosen colors and fonts are now active in this preview. To apply these changes permanently to your project, please describe your selected theme (main colors and fonts) to the AI assistant and ask to save it.",
      duration: 10000,
    });
  };


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Palette className="mr-2 h-5 w-5 text-accent" />
          Design System
        </CardTitle>
        <CardDescription>
          Experiment with colors and fonts. Changes are previewed live. To save, describe your desired theme to the AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3 text-foreground/90">Editable Colors</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
            {editableColors.filter(c => ['--primary', '--accent', '--background', '--foreground'].includes(c.variableName)).map((token) => (
              <div key={token.variableName} className="space-y-1.5">
                <Label htmlFor={`color-${token.variableName}`}>{token.name}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    id={`color-${token.variableName}`}
                    value={token.currentHex}
                    onChange={(e) => handleColorChange(token.variableName, e.target.value)}
                    className="w-10 h-10 p-0 border-0 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={token.currentHex}
                    onChange={(e) => handleColorChange(token.variableName, e.target.value)}
                    className="flex-grow h-10"
                    pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Default: {token.defaultHex} (HSL: {token.hslValue})</p>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-semibold mb-3 text-foreground/90">Editable Fonts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {editableFonts.map((font) => (
              <div key={font.name} className="space-y-1.5">
                <Label htmlFor={`font-${font.name.toLowerCase().replace(' ', '-')}`}>{font.name}</Label>
                <Select
                  value={font.currentFont}
                  onValueChange={(value) => handleFontChange(font.name, value)}
                >
                  <SelectTrigger id={`font-${font.name.toLowerCase().replace(' ', '-')}`}>
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    {font.options.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 <p className="text-xs text-muted-foreground">Default: {font.defaultFont}</p>
              </div>
            ))}
          </div>
          <style jsx global>{`
            body {
              font-family: var(${initialFontValues.body.tailwindVariable}, Inter, sans-serif);
            }
            .font-headline {
              font-family: var(${initialFontValues.headline.tailwindVariable}, Inter, sans-serif);
            }
          `}</style>
        </div>

        <Separator />
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
           <Button variant="outline" onClick={handleRevertToDefaults}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Default Theme
          </Button>
          <Button onClick={handleSaveChanges}>
            <Palette className="mr-2 h-4 w-4" />
            Save Theme
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
