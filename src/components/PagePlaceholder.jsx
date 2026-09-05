function PagePlaceholder({ title, note }) {
  return (
    <section>
      <h1>{title}</h1>
      <p>{note ?? 'This section is not implemented yet.'}</p>
    </section>
  )
}

export default PagePlaceholder