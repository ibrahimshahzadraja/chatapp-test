export async function generateMetadata({ params }) {
    const { chatname } = await params;
  
    return {
      title: `${chatname} - Management`,
    };
  }
  
  export default function ChatDetailsLayout({ children, params }) {
    return (
      <div>
        {children}
      </div>
    );
  }
  