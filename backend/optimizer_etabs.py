# optimizer_etabs.py

import comtypes.client
import json

# Connect to ETABS Application
def extract_from_etabs():
    try:
        etabsObject = comtypes.client.GetActiveObject("CSI.ETABS.API.ETABSObject")
    except (OSError, Exception):
        return []

    SapModel = etabsObject.SapModel

    # Extract beams
    beam_names = []
    frame_count = SapModel.FrameObj.Count()
    names = comtypes.client.CreateObject("SAP2000v1.cStringArray")
    SapModel.FrameObj.GetNameList(names)

    for name in names:
        is_beam = SapModel.FrameObj.GetLabelFromName(name)[2] == "Beam"
        if is_beam:
            length = SapModel.FrameObj.GetLength(name)
            _, load = SapModel.FrameObj.GetLoadDistributed(name, 1)
            beam_names.append({
                "beam": name,
                "length": length,
                "load": load[0][3] if load else 10,  # fallback load
                "original": SapModel.FrameObj.GetSection(name)[0]
            })

    return beam_names


def load_beam_library():
    with open("beam_library.json") as f:
        return json.load(f)


def calculate_moment(length, load):
    return (load * (length ** 2)) / 8


def genetic_algorithm(beam_data, beam_library):
    optimized = []

    for beam in beam_data:
        moment = calculate_moment(beam["length"], beam["load"])
        suitable = [b for b in beam_library if b["MaxMoment"] >= moment]
        if suitable:
            best = min(suitable, key=lambda x: x["Cost"])
            optimized.append({
                "beam": beam["beam"],
                "original": beam["original"],
                "optimized": best["Section"],
                "cost": best["Cost"]
            })
        else:
            optimized.append({
                "beam": beam["beam"],
                "original": beam["original"],
                "optimized": beam["original"],
                "cost": "No replacement"
            })
    return optimized


def run_etabs_optimizer():
    beam_data = extract_from_etabs()
    beam_library = load_beam_library()
    return genetic_algorithm(beam_data, beam_library)
