interface Props {
  name: string;
  filled?: boolean;
  className?: string;
}

export default function Icon({ name, filled, className = "" }: Props) {
  return (
    <span className={`material-symbols-outlined ${filled ? "material-symbols-filled" : ""} ${className}`}>
      {name}
    </span>
  );
}
