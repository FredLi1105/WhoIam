import { motion } from "framer-motion";
import "../style/IntroLogo.css";

function IntroLogo({ initials = "FL", name = "Fred Li" }) {
  const firstLetter = initials[0];
  const lastLetter = initials[initials.length - 1];

  const firstIndex = name.toLowerCase().indexOf(firstLetter.toLowerCase());

  const lastIndex = name.toLowerCase().lastIndexOf(lastLetter.toLowerCase());

  const middleText = name.slice(firstIndex + 1, lastIndex);
  const endingText = name.slice(lastIndex + 1);

  return (
    <div className="intro-logo  margin-top-20">
      {/* F */}
      <motion.span
        className="intro-letter intro-first"
        initial={{
          left: "50%",
          top: "50%",
          x: "-100%",
          y: "-50%",
          fontSize: "400px",
        }}
        animate={{
          left: "40px",
          top: "28px",
          x: "0%",
          y: "0%",
          fontSize: "28px",
        }}
        transition={{
          duration: 3,
          ease: [0.76, 0, 0.24, 1],
        }}
      >
        {firstLetter}
      </motion.span>

      {/* red */}
      <motion.span
        className="intro-middle"
        initial={{
          left: "50%",
          top: "50%",
          x: "-50%",
          y: "-50%",
          fontSize: "28px",
          opacity: 0,
          filter: "blur(10px)",
        }}
        animate={{
          left: "72px",
          top: "28px",
          x: "0%",
          y: "0%",
          fontSize: "28px",
          opacity: 1,
          filter: "blur(0px)",
        }}
        transition={{
          delay: 0.55,
          duration: 0.9,
          ease: "easeOut",
        }}
      >
        {middleText}
      </motion.span>

      {/* L */}
      <motion.span
        className="intro-letter intro-last"
        initial={{
          left: "50%",
          top: "50%",
          x: "0%",
          y: "-50%",
          fontSize: "400px",
        }}
        animate={{
          left: "125px",
          top: "28px",
          x: "0%",
          y: "0%",
          fontSize: "28px",
        }}
        transition={{
          duration: 3,
          ease: [0.76, 0, 0.24, 1],
        }}
      >
        {lastLetter}
      </motion.span>

      {/* i */}
      <motion.span
        className="intro-ending"
        initial={{
          left: "50%",
          top: "50%",
          opacity: 0,
          filter: "blur(10px)",
          fontSize: "28px",
        }}
        animate={{
          left: "153px",
          top: "28px",
          opacity: 1,
          filter: "blur(0px)",
          fontSize: "28px",
        }}
        transition={{
          delay: 0.9,
          duration: 0.6,
          ease: "easeOut",
        }}
      >
        {endingText}
      </motion.span>
    </div>
  );
}

export default IntroLogo;
