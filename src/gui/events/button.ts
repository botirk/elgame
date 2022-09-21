import settings from "../../settings";

interface ButtonRequest {
  button: string,
  onReleased: () => void,
  onPressed?: () => void,
};

const button = (ctx: CanvasRenderingContext2D) => {
  const requesters: ButtonRequest[] = [];

  document.addEventListener("keydown", (e) => { 
    requesters.forEach((req) => { if (req.button == e.key) req.onPressed?.(); });
  });
  document.addEventListener("keyup", (e) => { 
    requesters.forEach((req) => { if (req.button == e.key) req.onReleased(); });
  });

  const addButtonRequest = (req: ButtonRequest) => {
    requesters.push(req);
    
    const removeRequest = () => {
      const i = requesters.indexOf(req);
      if (i != -1) requesters.splice(i, 1);
    }
    return removeRequest;
  }

  return addButtonRequest;
}

export default button;