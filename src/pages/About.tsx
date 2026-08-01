import { Link } from 'react-router'

export default function About() {
  return (
    <section id="center">
      <div>
        <h1>About</h1>
        <p>This is an example route at <code>/about</code>.</p>
        <p>
          <Link to="/">← Back home</Link>
        </p>
      </div>
    </section>
  )
}
