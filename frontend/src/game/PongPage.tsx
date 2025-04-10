// import React from "react";
// import Pong from "./Pong"; // Import the Pong game component
// import { useParams } from "react-router-dom";


// const PongPage = () => {
//   return (
//     <div>
//       {/* <h1>PONG GAME</h1> */}
//       <Pong />
//       {/* <Pong /> */}
//     </div>
//   );
// };

// export default PongPage;

import React from "react";
import Pong from "./Pong"; // Import the Pong game component
import { useParams } from "react-router-dom";

const PongPage = () => {
  // const { roomId: urlRoomId } = useParams();
  const { roomId } = useParams();


  return (
    <div>
      {/* <Pong urlRoomId={urlRoomId} /> */}
      <Pong urlRoomId={roomId} />
    </div>
  );
};

export default PongPage;
