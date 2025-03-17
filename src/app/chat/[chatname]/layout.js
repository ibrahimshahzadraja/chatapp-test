export async function generateMetadata({ params }) {
    const { chatname } = await params;
  
    return {
      title: `${chatname} - Chat`,
    };
  }
  
  export default function ChatLayout({ children, params }) {
    return (
      <div>
        {children}
      </div>
    );
  }
  