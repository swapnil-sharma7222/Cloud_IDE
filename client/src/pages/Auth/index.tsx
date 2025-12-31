import { Button, TextField } from "@mui/material";
import Box from "@mui/material/Box";
import axios from "axios";
import React, { useEffect } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { setUser } from "../../features/user/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../app/store";
import { jwtDecode } from "jwt-decode";

interface JWTPayload {
  isAuth: boolean;
  name: string;
  iat?: number;
  exp?: number;
}

const Auth = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();

  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
  const redirectUrl = searchParams.get('redirect');

  // useEffect(() => {
  //   const token = sessionStorage.getItem('jwt_token');
  //   console.log("token", token)
  //   console.log("isAuth", isAuthenticated)
    
  //   if (token && isAuthenticated) {
  //     console.log('Already authenticated, redirecting...');
  //     if (redirectUrl) {
  //       console.log("Redirecting")
  //       navigate(decodeURIComponent(redirectUrl), { replace: true });
  //     } else {
  //       navigate('/swapnil', { replace: true });
  //     }
  //   }
  // }, []);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:4200/v1/api/login", {
        name,
        password
      });

      if (response.data.success && response.data.token) {
        console.log('✅ Login successful');
        sessionStorage.setItem('jwt_token', response.data.token);
        const decoded = jwtDecode<JWTPayload>(response.data.token);
        dispatch(setUser({
          name: decoded.name,
          isAuthenticated: true
        }));

        setName("");
        setPassword("");

        setTimeout(() => {
          if (redirectUrl) {
            console.log("redirecting");
            
            navigate(decodeURIComponent(redirectUrl), { replace: true });
          } else {
            console.log("to ss");
            
            navigate('/', {replace: true})
          }
        }, 100);

      } else {
        alert("Login failed. Please check your credentials.");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      let errorMessage = "Login failed";
      if (error.response) {
        errorMessage = error.response.data?.error || 
                      error.response.data?.message || 
                      "Server error occurred";
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      height: "100vh",
      backgroundColor: "#f5f5f5"
    }}>
      <h1>Welcome to Cloud IDE</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        Sign in to continue
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
          label="Name" 
          variant="outlined" 
          disabled={loading} 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
        />
        <TextField 
          label="Password" 
          variant="outlined" 
          type="password" 
          disabled={loading} 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        <Button 
          type="submit" 
          variant="contained"
          disabled={loading}
          sx={{ height: 45 }}
        >
          {loading ? "Signing In..." : "Sign In"}
        </Button>
      </Box>
    </div>
  );
};

export default Auth;