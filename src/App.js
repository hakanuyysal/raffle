import './App.css';
import Main from './components/main/Main';
import Snow from './components/snow/Snow';
import Count from './components/count/Count';
import Game from './components/game/Game';

function App() {
  return (
    <div className="App">
      <Snow />
      <Main />
      <Count />
      <Game />

    </div>
  );
}

export default App;
