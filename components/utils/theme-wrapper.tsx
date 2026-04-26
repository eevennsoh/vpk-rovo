"use client";

import { createContext, use, useEffect, useRef, useState } from "react";
import { setGlobalTheme } from "@atlaskit/tokens";
import DevicesIcon from "@atlaskit/icon/core/devices";
import ThemeIcon from "@atlaskit/icon/core/theme";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	actualTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeWrapperProps {
	children: React.ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
}

const isTheme = (value: string | null): value is Theme => {
	return value === "light" || value === "dark" || value === "system";
};

const getStoredTheme = (storageKey: string): Theme | undefined => {
	if (typeof window === "undefined") {
		return undefined;
	}

	try {
		const storedTheme = window.localStorage.getItem(storageKey);
		return isTheme(storedTheme) ? storedTheme : undefined;
	} catch {
		return undefined;
	}
};

export function ThemeWrapper({ children, defaultTheme = "system", storageKey = "ui-theme" }: Readonly<ThemeWrapperProps>) {
	const [theme, setTheme] = useState<Theme>(defaultTheme);
	const [actualTheme, setActualTheme] = useState<"light" | "dark">(defaultTheme === "dark" ? "dark" : "light");
	const hasHydratedThemeRef = useRef(false);

	// Update actual theme based on current theme setting
	useEffect(() => {
		let unbind: (() => void) | undefined;
		let isUnmounted = false;
		let effectiveTheme = theme;

		if (!hasHydratedThemeRef.current) {
			hasHydratedThemeRef.current = true;

			const storedTheme = getStoredTheme(storageKey);
			if (storedTheme) {
				effectiveTheme = storedTheme;
				if (storedTheme !== theme) {
					const syncStoredTheme = () => {
						if (!isUnmounted) {
							setTheme(storedTheme);
						}
					};

					if (typeof queueMicrotask === "function") {
						queueMicrotask(syncStoredTheme);
					} else {
						setTimeout(syncStoredTheme, 0);
					}
				}
			}
		}

		const updateActualTheme = () => {
			let newActualTheme: "light" | "dark" = "light";

			if (effectiveTheme === "system") {
				newActualTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
			} else {
				newActualTheme = effectiveTheme;
			}

			setActualTheme(newActualTheme);

			// Update document class for Tailwind dark mode + color-scheme
			if (typeof document !== "undefined") {
				const root = document.documentElement;
				root.classList.remove("light", "dark");
				root.classList.add(newActualTheme);
				root.style.colorScheme = newActualTheme;
			}
		};

		updateActualTheme();
		void setGlobalTheme({
			colorMode: effectiveTheme === "system" ? "auto" : effectiveTheme,
			light: "light",
			dark: "dark",
			spacing: "spacing",
			typography: "typography",
			shape: "shape",
		}).then((nextUnbind) => {
			unbind = nextUnbind;
		});

		// Listen for system theme changes when in system mode
		if (effectiveTheme === "system") {
			const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
			mediaQuery.addEventListener("change", updateActualTheme);
			return () => {
				isUnmounted = true;
				mediaQuery.removeEventListener("change", updateActualTheme);
				unbind?.();
			};
		}

		return () => {
			isUnmounted = true;
			unbind?.();
		};
	}, [storageKey, theme]);

	// Update theme and persist to localStorage
	const updateTheme = (newTheme: Theme) => {
		setTheme(newTheme);
		if (typeof window !== "undefined") {
			localStorage.setItem(storageKey, newTheme);
		}
	};

	const value: ThemeContextType = {
		theme,
		setTheme: updateTheme,
		actualTheme,
	};

	return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme() {
	const context = use(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeWrapper");
	}
	return context;
}

// Theme toggle component for easy integration
export function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	const handleToggle = () => {
		if (theme === "light") {
			setTheme("dark");
		} else if (theme === "dark") {
			setTheme("system");
		} else {
			setTheme("light");
		}
	};

	function getThemeLabel() {
		if (theme === "light") return "Light theme";
		if (theme === "dark") return "Dark theme";
		return "System theme";
	}

	const themeLabel = getThemeLabel();
	const icon = theme === "system"
		? <DevicesIcon label="" />
		: <ThemeIcon label="" />;

	return (
		<Button aria-label={themeLabel} onClick={handleToggle} variant="ghost" size="icon">
			{icon}
		</Button>
	);
}

// Theme selector dropdown component
const themeOptions = [
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
	{ value: "system", label: "System" },
] as const;

export function ThemeSelector() {
	const { theme, setTheme } = useTheme();

	const selectedOption = themeOptions.find((opt) => opt.value === theme);

	return (
		<Select
			value={selectedOption?.value}
			onValueChange={(nextValue) => setTheme(nextValue as Theme)}
		>
			<SelectTrigger aria-label="Select theme">
				<SelectValue placeholder="Select theme" />
			</SelectTrigger>
			<SelectContent>
				{themeOptions.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
