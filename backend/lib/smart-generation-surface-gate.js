const SMART_ROUTE_TARGET_SURFACES = new Set([
	"multiports",
	"sidebar",
	"fullscreen",
	"rovo",
	"rovo-preview",
]);

function isSmartRouteTargetSurface(value) {
	return typeof value === "string" && SMART_ROUTE_TARGET_SURFACES.has(value);
}

module.exports = {
	SMART_ROUTE_TARGET_SURFACES,
	isSmartRouteTargetSurface,
};
