import React from "react";
import { TextField, Button, Box, CircularProgress } from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const LandingPage = () => {
  const navigate = useNavigate();
  const [projectName, setProjectName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const userId = useSelector((state: any) => state.user.name);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!projectName.trim()) {
      alert("Please enter a project name");
      return;
    }
    console.log("Form submitted! ", projectName);
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:4200/v1/api/init-project", {
        name: projectName,
        userId
      });
      console.log("Project created: ", response.data);
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      if (!response.data.userId || !response.data.containerId || !response.data.freePort) {
        throw new Error("Invalid response from server: missing required fields");
      }
      navigate(`/${response.data.userId}/dashboard`, {
        state: {
          userId: response.data.userId,
          containerId: response.data.containerId,
          freePort: response.data.freePort
        }
      });

      setProjectName("");
    } catch (error: any) {
      console.error("Error creating project:", error);
      let errorMessage = "Failed to create project";
      if (error.response) {
        errorMessage = error.response.data?.error ||
          error.response.data?.message ||
          "Server error occurred";
      } else if (error.code === "ECONNREFUSED" || error.message?.includes("ECONNREFUSED")) {
        errorMessage = "Cannot connect to server. Please check if backend is running on port 4200.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <h1>Welcome to Cloud IDE</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        Create a new project to get started
      </p>

      <Box
        component="form"
        onSubmit={handleFormSubmit}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          width: 400,
          padding: 4,
          backgroundColor: "white",
          borderRadius: 2,
          boxShadow: 3
        }}
      >
        <TextField
          label="Project Name"
          variant="outlined"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          disabled={loading}
          required
          helperText="Enter a unique name for your project"
        />

        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          sx={{ height: 45 }}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
              Creating Project...
            </>
          ) : (
            "Create Project"
          )}
        </Button>
      </Box>
    </div>
  );
};

export default LandingPage;
