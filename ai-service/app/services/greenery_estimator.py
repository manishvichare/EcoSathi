# app/services/greenery_estimator.py
# OPTIONAL (per architecture doc section 4.3: "optional: NDVI-style estimate
# from imagery"). The doc explicitly recommends SKIPPING real NDVI/satellite
# analysis for the hackathon — real NDVI needs Sentinel Hub / Google Earth
# Engine, which is "slow to set up" (section 2 callout box).
#
# The actual green cover % calculation is already handled on the Node
# backend via OSM Overpass data (src/services/greenCoverService.js) — that
# is the source of truth for the hackathon demo.
#
# This file is a stub so the folder structure matches the doc. Only build
# this out post-hackathon if you want a true satellite-imagery estimate.


def estimate_greenery_from_image(image_bytes: bytes) -> dict:
    """
    Placeholder for a future NDVI-style estimate from satellite/aerial imagery.
    Not used in the hackathon build — greenCoverService.js (Node backend)
    is the actual green cover source, per the doc's honest-shortcut guidance.
    """
    raise NotImplementedError(
        "Real NDVI estimation is out of scope for the hackathon build. "
        "Use the OSM Overpass-based green cover % from the Node backend instead."
    )