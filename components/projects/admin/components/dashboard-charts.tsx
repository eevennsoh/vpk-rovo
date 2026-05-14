"use client";

import {
	Area,
	AreaChart as RechartsAreaChart,
	Bar,
	BarChart as RechartsBarChart,
	CartesianGrid,
	Line,
	LineChart as RechartsLineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { token } from "@/lib/tokens";
import {
	ADMIN_AREA_CHART_DATA,
	ADMIN_BAR_CHART_DATA,
	ADMIN_LINE_CHART_DATA,
} from "../data/admin-data";

const CHART_MARGIN = { top: 4, right: 8, left: 0, bottom: 0 };
const CHART_HEIGHT = 208;

function getAxisTick() {
	return {
		fontSize: 11,
		fill: token("color.text.subtle"),
	};
}

function getTooltipStyle() {
	return {
		backgroundColor: token("elevation.surface.overlay"),
		border: `1px solid ${token("color.border")}`,
		borderRadius: token("radius.small"),
		fontSize: 12,
	};
}

export function AdminLineChart() {
	return (
		<ResponsiveContainer width="100%" height={CHART_HEIGHT} minWidth={0}>
			<RechartsLineChart accessibilityLayer data={ADMIN_LINE_CHART_DATA} margin={CHART_MARGIN}>
				<CartesianGrid strokeDasharray="4 2" stroke={token("color.border")} vertical={false} />
				<XAxis dataKey="date" tick={getAxisTick()} axisLine={false} tickLine={false} />
				<YAxis tick={getAxisTick()} axisLine={false} tickLine={false} width={40} />
				<Tooltip contentStyle={getTooltipStyle()} />
				<Line
					type="monotone"
					dataKey="value"
					stroke={token("color.border.accent.blue")}
					strokeWidth={2}
					dot={{ r: 3, fill: token("color.border.accent.blue") }}
					activeDot={{ r: 5 }}
				/>
			</RechartsLineChart>
		</ResponsiveContainer>
	);
}

export function AdminAreaChart() {
	return (
		<ResponsiveContainer width="100%" height={CHART_HEIGHT} minWidth={0}>
			<RechartsAreaChart accessibilityLayer data={ADMIN_AREA_CHART_DATA} margin={CHART_MARGIN}>
				<CartesianGrid strokeDasharray="4 2" stroke={token("color.border")} vertical={false} />
				<XAxis dataKey="date" tick={getAxisTick()} axisLine={false} tickLine={false} />
				<YAxis
					tick={getAxisTick()}
					axisLine={false}
					tickLine={false}
					width={50}
					domain={[11000, 15000]}
				/>
				<Tooltip contentStyle={getTooltipStyle()} />
				<Area
					type="monotone"
					dataKey="value"
					stroke={token("color.border.accent.blue")}
					strokeWidth={2}
					fill={token("color.background.accent.blue.subtlest")}
					dot={{ r: 3, fill: token("color.border.accent.blue") }}
					activeDot={{ r: 5 }}
				/>
			</RechartsAreaChart>
		</ResponsiveContainer>
	);
}

export function AdminBarChart() {
	return (
		<ResponsiveContainer width="100%" height={CHART_HEIGHT} minWidth={0}>
			<RechartsBarChart accessibilityLayer data={ADMIN_BAR_CHART_DATA} margin={CHART_MARGIN}>
				<CartesianGrid strokeDasharray="4 2" stroke={token("color.border")} vertical={false} />
				<XAxis dataKey="label" tick={getAxisTick()} axisLine={false} tickLine={false} />
				<YAxis tick={getAxisTick()} axisLine={false} tickLine={false} width={35} />
				<Tooltip contentStyle={getTooltipStyle()} />
				<Bar dataKey="value" fill={token("color.background.accent.blue.subtler")} radius={[2, 2, 0, 0]} />
			</RechartsBarChart>
		</ResponsiveContainer>
	);
}
