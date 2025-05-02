import comtypes
import comtypes.client
import json
import os
import traceback
import math

def run_etabs_optimizer():
    try:
        comtypes.CoInitialize()
        etabs = comtypes.client.GetActiveObject("CSI.ETABS.API.ETABSObject")
        SapModel = etabs.SapModel

        # Get all frames
        raw = SapModel.FrameObj.GetAllFrames()
        ret, names, props, *_ , start_joints, end_joints = raw[:6]

        if ret not in (0, 160):
            return {"error": f"GetAllFrames failed (ret={ret})", "frames": []}
        if len(names) == 0:
            return {"frames": [], "suggestion": [], "message": "No frame objects found."}

        frames = []
        for i, name in enumerate(names):
            section = props[i]
            start = start_joints[i]
            end = end_joints[i]
            length = None
            load_value = 0.0

            # Compute length from joint coordinates
            try:
                r1, x1, y1, z1 = SapModel.PointObj.GetCoordCartesian(start)
                r2, x2, y2, z2 = SapModel.PointObj.GetCoordCartesian(end)
                if r1 == 0 and r2 == 0:
                    length = math.dist((x1, y1, z1), (x2, y2, z2))
                else:
                    print(f"⚠️ Warning: Joint coord failed for '{name}'")
            except Exception:
                print(f"⚠️ Exception computing length for '{name}':\n{traceback.format_exc()}")

            # Get distributed load (raw tuple)
            try:
                raw_ld = SapModel.FrameObj.GetLoadDistributed(name, 1)
                load_data = raw_ld[-1] if len(raw_ld) >= 3 else []
                if load_data and load_data[0]:
                    load_value = load_data[0][3]
                else:
                    print(f"⚠️ No load data for '{name}'")
            except Exception:
                print(f"⚠️ Exception in load for '{name}':\n{traceback.format_exc()}")

            frames.append({
                "name": name,
                "start": start,
                "end": end,
                "length": length,
                "load": load_value,
                "section": section
            })

        suggestions = analyze_and_optimize(frames)
        return {"frames": frames, "suggestion": suggestions}

    except Exception as conn_e:
        return {"error": f"Connection failed: {conn_e}"}
    finally:
        try:
            comtypes.CoUninitialize()
        except:
            pass


def analyze_and_optimize(frames):
    # Load beam library
    try:
        lib_path = os.path.join(os.path.dirname(__file__), "beam_library.json")
        with open(lib_path) as f:
            beam_library = json.load(f)
    except Exception as e:
        return [{"error": f"Failed to load beam library: {e}"}]

    suggestions = []
    for frame in frames:
        length = frame.get("length") or 0.0
        load_val = frame.get("load", 0.0)
        if not length or length <= 0:
            continue

        moment_req = (load_val * length ** 2) / 8.0
        suitable = [b for b in beam_library if b.get("MaxMoment", 0) >= moment_req]
        if not suitable:
            continue
        optimal = min(suitable, key=lambda b: b.get("Cost", float('inf')))

        suggestions.append({
            "frame": frame["name"],
            "current_section": frame["section"],
            "suggested_section": optimal["Section"],
            "moment_required": round(moment_req, 2),
            "estimated_cost": optimal.get("Cost")
        })
    return suggestions

if __name__ == '__main__':
    import json
    result = run_etabs_optimizer()
    print(json.dumps(result, indent=2))
