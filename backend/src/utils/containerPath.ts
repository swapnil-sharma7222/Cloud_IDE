import os from "os";
import path from "path";

export const containerPath = (projectName: string) => {
  return path.join(os.homedir(), "Desktop/newFolder/folder/", projectName);
}
console.log(containerPath("pro1"));
