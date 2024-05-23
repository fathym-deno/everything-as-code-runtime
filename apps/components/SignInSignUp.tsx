import { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { Action, classSet } from '@fathym/atomic';

export const IsIsland = true;

export type SignInSignUpProps = {
  remote: boolean;
} & JSX.HTMLAttributes<HTMLDivElement>;

export default function SignInSignUp(props: SignInSignUpProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignUp, setShowSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    if (props.remote) {
      location.href = '/dashboard';
    }
  };

  const handleSignUpClick = () => {
    setShowSignUp(true);
  };

  const handleForgotPasswordClick = () => {
    setShowForgotPassword(true);
  };

  return (
    <div class='w-full max-w-md mx-auto p-6 bg-gray-50 dark:bg-slate-700 rounded-lg shadow-md'>
      <h2 class='text-xl font-bold mb-4 text-center'>
        {props.remote
          ? 'Sign in with Fatyhm'
          : showForgotPassword
          ? 'Password Recovery'
          : showSignUp
          ? 'Sign Up'
          : 'Sign In'}
      </h2>

      {props.remote && (
        <>
          <p class='text-lg mb-4 text-center max-w-sm'>
            You'll log in with the Fathym authentication system, and then we'll get you in to the
            dashboard to start working.
          </p>

          <Action
            onClick={handleSubmit}
            class={classSet(
              [
                'w-full md:w-auto mx-auto text-white font-bold m-1 py-2 px-4 rounded focus:outline-none shadow-lg',
              ],
              // callToActionStyles.props
            )}
          >
            Sign In Now
          </Action>
        </>
      )}

      {!props.remote && (
        <>
          <form onSubmit={handleSubmit} class='space-y-4'>
            <div>
              <label
                class='block text-sm font-medium text-gray-700 dark:text-gray-200'
                for='email'
              >
                Email Address
              </label>
              <input
                type='email'
                id='email'
                value={email}
                onInput={(e) => setEmail(e.target.value)}
                class='mt-1 p-2 w-full border rounded-lg dark:bg-slate-600 dark:border-slate-500 dark:text-white'
                placeholder='you@example.com'
              />
            </div>
            {!showForgotPassword && (
              <div>
                <label
                  class='block text-sm font-medium text-gray-700 dark:text-gray-200'
                  for='password'
                >
                  Password
                </label>
                <input
                  type='password'
                  id='password'
                  value={password}
                  onInput={(e) => setPassword(e.target.value)}
                  class='mt-1 p-2 w-full border rounded-lg dark:bg-slate-600 dark:border-slate-500 dark:text-white'
                  placeholder='••••••••'
                />
              </div>
            )}
            {showSignUp && (
              <div>
                <label
                  class='block text-sm font-medium text-gray-700 dark:text-gray-200'
                  for='confirm_password'
                >
                  Confirm Password
                </label>
                <input
                  type='password'
                  id='confirm_password'
                  value={confirmPassword}
                  onInput={(e) => setConfirmPassword(e.target.value)}
                  class='mt-1 p-2 w-full border rounded-lg dark:bg-slate-600 dark:border-slate-500 dark:text-white'
                  placeholder='••••••••'
                />
              </div>
            )}
            <div class='flex items-center justify-between'>
              {!showForgotPassword && !showSignUp && (
                <div class='flex items-center'>
                  <input
                    type='checkbox'
                    id='remember_me'
                    class='h-4 w-4 text-blue-600 dark:text-blue-400 border-gray-300 rounded dark:border-slate-500'
                  />
                  <label
                    class='ml-2 block text-sm text-gray-900 dark:text-gray-300'
                    for='remember_me'
                  >
                    Remember me
                  </label>
                </div>
              )}
              <div class='text-sm'>
                {!showForgotPassword
                  ? (
                    !showSignUp
                      ? (
                        <a
                          href='#'
                          onClick={handleForgotPasswordClick}
                          class='font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400'
                        >
                          Forgot your password?
                        </a>
                      )
                      : undefined
                  )
                  : (
                    <a
                      href='#'
                      onClick={() => setShowForgotPassword(false)}
                      class='font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400'
                    >
                      Back to Sign In
                    </a>
                  )}
              </div>
            </div>
            <div>
              <button
                type='submit'
                class='w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 dark:bg-blue-800 dark:hover:bg-blue-900'
              >
                {showForgotPassword ? 'Recover Password' : showSignUp ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </form>

          {!showSignUp && !showForgotPassword && (
            <div class='text-center mt-4'>
              <p class='text-sm text-gray-600 dark:text-gray-400'>
                Don't have an account?{' '}
                <a
                  href='#'
                  onClick={handleSignUpClick}
                  class='font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400'
                >
                  Sign up here
                </a>
              </p>
            </div>
          )}

          {showSignUp && !showForgotPassword && (
            <div class='text-center mt-4'>
              <p class='text-sm text-gray-600 dark:text-gray-400'>
                Already have an account?{' '}
                <a
                  href='#'
                  onClick={() => setShowSignUp(false)}
                  class='font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400'
                >
                  Sign in here
                </a>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
