import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Cookies from 'js-cookie';
import { loginSuccess } from '../store/auth/actions';
import { RootState } from '../store';

export default function useAuth(): void {
  const user = useSelector((state: RootState) => state.auth.user);

  const dispatch = useDispatch();

  useEffect(() => {
    if (user) return;
    const encodedJwt = Cookies.get('AUTH_TOKEN');

    if (!encodedJwt) return;

    const { username }: { username: string } = JSON.parse(
      atob(encodedJwt.split('.')[1]),
    );

    dispatch(loginSuccess({ username }));
  }, []);
}
