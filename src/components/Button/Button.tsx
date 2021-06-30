import Link from 'next/link'

interface ButtonProps {
  db: string
  api: string
}

export function Button({ db, api }: ButtonProps) {
  
  return (
    <Link href={api}>
      <a>{db}</a>
    </Link>
  )
}
