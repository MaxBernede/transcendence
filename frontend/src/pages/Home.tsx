import React from 'react'
import { useNavigate } from 'react-router-dom'

interface LoginProps {
	loggedIn: boolean;
	email: string;
  setLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

const Home: React.FC<LoginProps> = ({ loggedIn, email, setLoggedIn }) => {
  // const { loggedIn, email, setLoggedIn } = props
  const navigate = useNavigate()

  const onButtonClick = () => {
    setLoggedIn(!loggedIn);
  }

  return (
    <div className="mainContainer">
      <div className={'titleContainer'}>
        <div>Welcome!</div>
      </div>
      <div>This is the home page.</div>
      <div className={'buttonContainer'}>
        <input
          className={'inputButton'}
          type="button"
          onClick={onButtonClick}
          value={loggedIn ? 'Log out' : 'Log in'}
        />
        {loggedIn ? <div>Your email address is {email}</div> : <div />}
      </div>
    </div>
  )
}

export default Home