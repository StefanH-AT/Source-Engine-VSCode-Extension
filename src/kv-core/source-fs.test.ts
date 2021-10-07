import { getParentDocumentDirectory } from "./source-fs";

test("getParentDocumentDirectory UNIX", () => {
    const path = "/whatever/steam/steamapps/common/game/materials/some/subfolder/in/this";
    const dirName = "materials";

    expect(getParentDocumentDirectory(path, dirName)).toBe("/whatever/steam/steamapps/common/game/materials");
});

test("getParentDocumentDirectory WINDOWS", () => {
    const path = "C:\\Program Files (x86)\\Steam\\steamapps\\common\\game\\materials\\some\\subfolder\\in\\this";
    const dirName = "materials";

    expect(getParentDocumentDirectory(path, dirName)).toBe("C:\\Program Files (x86)\\Steam\\steamapps\\common\\game\\materials");
});