export async function generateMetadata() {
  
    return {
      title: `Profile`,
    };
  }
  
  export default function ProfileLayout({ children }) {
    return (
      <div>
        {children}
      </div>
    );
  }
  