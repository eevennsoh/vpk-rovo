"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { token } from "@/lib/tokens";
import MenuIcon from "@atlaskit/icon/core/menu";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import EditIcon from "@atlaskit/icon/core/edit";
import SmartLinkEmbedIcon from "@atlaskit/icon/core/smart-link-embed";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import CrossIcon from "@atlaskit/icon/core/cross";
import LocationIcon from "@atlaskit/icon/core/location";
import BoardIcon from "@atlaskit/icon/core/board";
import AddIcon from "@atlaskit/icon/core/add";
import CustomizeIcon from "@atlaskit/icon/core/customize";
import MicrophoneIcon from "@atlaskit/icon/core/microphone";
import ArrowUpIcon from "@atlaskit/icon/core/arrow-up";
import InformationCircleIcon from "@atlaskit/icon/core/information-circle";
import LinkExternalIcon from "@atlaskit/icon/core/link-external";

const PANEL_WIDTH = 432;
const PANEL_HEIGHT = 480;

function IconBtn({
	children,
	label,
	onClick,
}: Readonly<{
	children: React.ReactNode;
	label: string;
	onClick?: () => void;
}>) {
	return (
		<button
			type="button"
			aria-label={label}
			onClick={onClick}
			className="rovo-icon-btn"
		>
			{children}
		</button>
	);
}

function QuickAction({
	icon,
	label,
	onClick,
}: Readonly<{
	icon: React.ReactNode;
	label: string;
	onClick?: () => void;
}>) {
	return (
		<button type="button" onClick={onClick} className="rovo-quick-action">
			<span className="rovo-quick-action-icon">{icon}</span>
			<span className="rovo-quick-action-label">{label}</span>
		</button>
	);
}

export default function RovoButtonPage() {
	const [isOpen, setIsOpen] = useState(false);
	const [prompt, setPrompt] = useState("");
	const [contextChip, setContextChip] = useState<string | null>("Vitafleet Q4 launch");
	const panelRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (!isOpen) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setIsOpen(false);
		};
		const onClickOutside = (e: MouseEvent) => {
			const target = e.target as Node;
			if (
				panelRef.current &&
				!panelRef.current.contains(target) &&
				buttonRef.current &&
				!buttonRef.current.contains(target)
			) {
				setIsOpen(false);
			}
		};
		window.addEventListener("keydown", onKey);
		window.addEventListener("mousedown", onClickOutside);
		return () => {
			window.removeEventListener("keydown", onKey);
			window.removeEventListener("mousedown", onClickOutside);
		};
	}, [isOpen]);

	const canSubmit = prompt.trim().length > 0;

	return (
		<div
			style={{
				position: "relative",
				width: "100%",
				height: "100%",
				minHeight: "560px",
				backgroundColor: token("color.background.neutral.subtle"),
				overflow: "hidden",
			}}
		>
			<style
				dangerouslySetInnerHTML={{
					__html: `
					.rovo-fab {
						position: absolute;
						bottom: 24px;
						right: 24px;
						width: 48px;
						height: 48px;
						border-radius: ${token("radius.xlarge")};
						background-color: var(--rovo-fab-bg, ${token("color.background.neutral.bold")});
						border: none;
						display: flex;
						align-items: center;
						justify-content: center;
						cursor: pointer;
						transform-origin: center;
						will-change: transform;
						transition:
							transform var(--duration-medium) var(--ease-out),
							opacity var(--duration-medium) var(--ease-out),
							background-color var(--duration-medium) var(--ease-out);
						z-index: 5;
						box-shadow: ${token("elevation.shadow.overlay")};
					}
					.rovo-fab:hover { transform: scale(1.125); }
					.rovo-fab img { width: 24px; height: 24px; pointer-events: none; }
					[data-theme="dark"] .rovo-fab { --rovo-fab-bg: ${token("elevation.surface")}; }
					@media (prefers-color-scheme: dark) {
						.rovo-fab { --rovo-fab-bg: ${token("elevation.surface")}; }
					}
					[data-theme="light"] .rovo-fab { --rovo-fab-bg: ${token("color.background.neutral.bold")}; }

					.rovo-panel {
						position: absolute;
						bottom: 24px;
						right: 24px;
						width: ${PANEL_WIDTH}px;
						height: ${PANEL_HEIGHT}px;
						background-color: ${token("elevation.surface")};
						border-radius: ${token("radius.xlarge")};
						box-shadow: ${token("elevation.shadow.overlay")};
						display: flex;
						flex-direction: column;
						overflow: hidden;
						transform-origin: bottom right;
						z-index: 10;
					}

					.rovo-icon-btn {
						width: 32px;
						height: 32px;
						display: inline-flex;
						align-items: center;
						justify-content: center;
						border: none;
						background: transparent;
						border-radius: ${token("radius.small")};
						color: ${token("color.icon")};
						cursor: pointer;
						transition: background-color var(--duration-fast) var(--ease-out);
					}
					.rovo-icon-btn:hover {
						background-color: ${token("color.background.neutral.subtle.hovered")};
					}

					.rovo-quick-action {
						display: flex;
						align-items: center;
						gap: ${token("space.150")};
						width: 100%;
						padding: ${token("space.100")};
						background: transparent;
						border: none;
						border-radius: ${token("radius.medium")};
						cursor: pointer;
						text-align: left;
						transition: background-color var(--duration-fast) var(--ease-out);
					}
					.rovo-quick-action:hover {
						background-color: ${token("color.background.neutral.subtle.hovered")};
					}
					.rovo-quick-action-icon {
						width: 40px;
						height: 40px;
						display: inline-flex;
						align-items: center;
						justify-content: center;
						border-radius: ${token("radius.small")};
						border: 1px solid ${token("color.border")};
						background-color: ${token("elevation.surface")};
						color: ${token("color.icon.subtle")};
						flex-shrink: 0;
					}
					.rovo-quick-action-label {
						font: ${token("font.body")};
						color: ${token("color.text")};
					}

					.rovo-context-row {
						display: flex;
						align-items: center;
						gap: ${token("space.100")};
						padding: ${token("space.100")} ${token("space.150")};
						background-color: ${token("color.background.neutral")};
						border-radius: ${token("radius.medium")};
					}
					.rovo-context-chip {
						display: inline-flex;
						align-items: center;
						gap: ${token("space.075")};
						padding: 2px ${token("space.100")} 2px ${token("space.075")};
						border-radius: ${token("radius.small")};
						background-color: ${token("elevation.surface")};
						border: 1px solid ${token("color.border.selected")};
						color: ${token("color.text")};
						font: ${token("font.body.small")};
					}
					.rovo-context-chip button {
						display: inline-flex;
						align-items: center;
						justify-content: center;
						width: 16px;
						height: 16px;
						border: none;
						background: transparent;
						color: ${token("color.icon.subtle")};
						cursor: pointer;
						border-radius: ${token("radius.xsmall")};
					}
					.rovo-context-chip button:hover {
						background-color: ${token("color.background.neutral.subtle.hovered")};
					}

					.rovo-composer {
						border: 1px solid ${token("color.border")};
						border-radius: ${token("radius.large")};
						padding: ${token("space.150")};
						display: flex;
						flex-direction: column;
						gap: ${token("space.150")};
						background-color: ${token("elevation.surface")};
					}
					.rovo-composer:focus-within {
						border-color: ${token("color.border.focused")};
						box-shadow: 0 0 0 1px ${token("color.border.focused")};
					}
					.rovo-composer-input {
						width: 100%;
						border: none;
						outline: none;
						background: transparent;
						resize: none;
						font: ${token("font.body")};
						color: ${token("color.text")};
						line-height: 1.5;
						min-height: 20px;
					}
					.rovo-composer-input::placeholder {
						color: ${token("color.text.subtlest")};
					}
					.rovo-composer-actions {
						display: flex;
						align-items: center;
						justify-content: space-between;
					}
					.rovo-send-btn {
						width: 28px;
						height: 28px;
						display: inline-flex;
						align-items: center;
						justify-content: center;
						border: none;
						border-radius: 999px;
						background-color: ${token("color.background.neutral")};
						color: ${token("color.icon.subtle")};
						cursor: not-allowed;
						transition: background-color var(--duration-fast) var(--ease-out);
					}
					.rovo-send-btn[data-active="true"] {
						background-color: ${token("color.background.brand.bold")};
						color: ${token("color.icon.inverse")};
						cursor: pointer;
					}
					.rovo-send-btn[data-active="true"]:hover {
						background-color: ${token("color.background.brand.bold.hovered")};
					}

					.rovo-footer {
						display: flex;
						align-items: center;
						justify-content: center;
						gap: ${token("space.075")};
						padding: ${token("space.100")} ${token("space.150")} ${token("space.150")};
						font: ${token("font.body.small")};
						color: ${token("color.text.subtle")};
					}
					.rovo-footer a {
						display: inline-flex;
						align-items: center;
						gap: 4px;
						color: inherit;
						text-decoration: none;
					}
					.rovo-footer a:hover { text-decoration: underline; }
					`,
				}}
			/>

			{/* Floating Rovo button */}
			<button
				ref={buttonRef}
				type="button"
				className="rovo-fab"
				aria-label="Open Rovo"
				aria-expanded={isOpen}
				onClick={() => setIsOpen((prev) => !prev)}
				style={{
					opacity: isOpen ? 0 : 1,
					pointerEvents: isOpen ? "none" : "auto",
				}}
			>
				<Image src="/1p/rovo.svg" alt="" width={24} height={24} aria-hidden />
			</button>

			{/* Chat panel */}
			{isOpen ? (
				<div
					ref={panelRef}
					className="rovo-panel"
					role="dialog"
					aria-label="Rovo chat"
				>
					{/* Header */}
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							padding: token("space.150"),
						}}
					>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: token("space.050"),
							}}
						>
							<IconBtn label="Menu">
								<MenuIcon label="" />
							</IconBtn>
							<button
								type="button"
								style={{
									display: "inline-flex",
									alignItems: "center",
									gap: token("space.075"),
									padding: `${token("space.050")} ${token("space.100")}`,
									background: "transparent",
									border: "none",
									borderRadius: token("radius.small"),
									cursor: "pointer",
								}}
							>
								<Image
									src="/1p/rovo.svg"
									alt=""
									width={20}
									height={20}
									aria-hidden
								/>
								<span
									style={{
										font: token("font.body"),
										fontWeight: token("font.weight.semibold"),
										color: token("color.text"),
									}}
								>
									Rovo
								</span>
								<ChevronDownIcon label="" size="small" />
							</button>
						</div>

						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: token("space.025"),
							}}
						>
							<IconBtn label="New chat">
								<EditIcon label="" />
							</IconBtn>
							<IconBtn label="Switch view">
								<SmartLinkEmbedIcon label="" />
							</IconBtn>
							<IconBtn label="More">
								<ShowMoreHorizontalIcon label="" />
							</IconBtn>
							<IconBtn label="Close" onClick={() => setIsOpen(false)}>
								<CrossIcon label="" />
							</IconBtn>
						</div>
					</div>

					{/* Body */}
					<div
						style={{
							flex: 1,
							display: "flex",
							flexDirection: "column",
							gap: token("space.100"),
							padding: `0 ${token("space.200")} ${token("space.150")}`,
							overflow: "auto",
						}}
					>
						<QuickAction
							icon={<BoardIcon label="" />}
							label="Improve description"
						/>
						<QuickAction
							icon={<LinkExternalIcon label="" />}
							label="Link Confluence content"
						/>

						{contextChip ? (
							<div className="rovo-context-row">
								<span
									style={{
										display: "inline-flex",
										alignItems: "center",
										gap: token("space.050"),
										color: token("color.text.subtle"),
										font: token("font.body.small"),
									}}
								>
									<LocationIcon label="" size="small" />
									Context:
								</span>
								<span className="rovo-context-chip">
									<BoardIcon label="" size="small" />
									{contextChip}
									<button
										type="button"
										aria-label="Remove context"
										onClick={() => setContextChip(null)}
									>
										<CrossIcon label="" size="small" />
									</button>
								</span>
							</div>
						) : null}

						{/* Composer */}
						<div className="rovo-composer">
							<textarea
								className="rovo-composer-input"
								placeholder="Ask, @mention, or / for actions"
								value={prompt}
								rows={2}
								onChange={(e) => setPrompt(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey && canSubmit) {
										e.preventDefault();
										setPrompt("");
									}
								}}
							/>
							<div className="rovo-composer-actions">
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: token("space.025"),
									}}
								>
									<IconBtn label="Add">
										<AddIcon label="" />
									</IconBtn>
									<IconBtn label="Customize">
										<CustomizeIcon label="" />
									</IconBtn>
								</div>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: token("space.025"),
									}}
								>
									<IconBtn label="Dictate">
										<MicrophoneIcon label="" />
									</IconBtn>
									<button
										type="button"
										aria-label="Send"
										className="rovo-send-btn"
										data-active={canSubmit}
										onClick={() => canSubmit && setPrompt("")}
									>
										<ArrowUpIcon label="" size="small" />
									</button>
								</div>
							</div>
						</div>
					</div>

					{/* Footer */}
					<div className="rovo-footer">
						<InformationCircleIcon label="" size="small" />
						<a href="#" onClick={(e) => e.preventDefault()}>
							Uses AI. Verify results. <LinkExternalIcon label="" size="small" />
						</a>
					</div>
				</div>
			) : null}
		</div>
	);
}
