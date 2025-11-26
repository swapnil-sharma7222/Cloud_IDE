import React from "react"
import FolderStructure from "./FolderStructure"
import VideoChat from "./video-chat"
import { useParams } from "react-router-dom"
import VideoView from "./VideoView"

interface SidebarProps {
  isInRoom: boolean
}

const Sidebar: React.FC<SidebarProps> = ({ isInRoom }) => {

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {isInRoom && (
        <div
          style={{
            height: "200px",
            borderBottom: "1px solid #ccc",
            backgroundColor: "#000",
            flexShrink: 0,
          }}
        >
          <VideoView isInRoom={isInRoom} />
        </div>
      )}

      {/* Folder structure - takes remaining space */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <FolderStructure />
      </div>
    </div>
  )
}

export default Sidebar