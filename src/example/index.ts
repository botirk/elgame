import init from '../index';

const [state, msg] = init("elgame");

if (!state) alert(msg);
