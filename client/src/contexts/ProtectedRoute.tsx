import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { isRoomIdValid } from '../utils/isRoomIdValid';
import { useSocket } from './SocketContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

interface JWTPayload {
  isAuth: boolean;
  name: string;
  iat?: number;
  exp?: number;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const tokenn = Cookies.get('jwt_token') || sessionStorage.getItem('jwt_token');
  const token = sessionStorage.getItem('jwt_token');
  const location = useLocation();
  const { userId, roomId } = useParams();
  const fallbackUrl = encodeURIComponent(location.pathname);
  const { socket } = useSocket();

  const [validationState, setValidationState] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');

    useEffect(() => {
      const validateAccess = async () => {
        if (!token) {
          setValidationState('unauthorized');
          return;
        }
  
        try {
          const decoded = jwtDecode<JWTPayload>(token);
  
          if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            sessionStorage.removeItem('jwt_token');
            setValidationState('unauthorized');
            return;
          }
  
          let hasAccess = false;
          if (!userId) {
            hasAccess = true;           
          } else if (userId === decoded.name) {
            hasAccess = true;
          } else if (roomId) {
            const isValid = await isRoomIdValid(roomId);
            hasAccess = isValid;
          }
  
          setValidationState(hasAccess ? 'authorized' : 'unauthorized');
        } catch {
          sessionStorage.removeItem('jwt_token');
          setValidationState('unauthorized');
        }
      };
  
      validateAccess();
    }, [token, userId, roomId]);

  if (validationState === 'loading') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#1e1e1e',
        color: 'white',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '2rem' }}>🔒</div>
        <div>Validating access...</div>
      </div>
    );
  }

  if (validationState === 'unauthorized') {
    console.log("navigating back to /auth because validationState === 'unauthorized'");
    
    return <Navigate to={`/auth`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;