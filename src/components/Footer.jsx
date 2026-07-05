export default function Footer({ note }) {
  return (
    <footer>
      <span>{note || 'LabSim — built by a Civil Engineering student, NIT Agartala'}</span>
      <a href="https://github.com/harxhpatell" target="_blank" rel="noopener noreferrer">
        github.com/harxhpatell
      </a>
    </footer>
  );
}
