# P2P Chat 🔐

A fully end-to-end encrypted peer-to-peer chat application built with WebRTC. No server required after the initial page load—all communication is direct browser-to-browser.

## Features ✨

- **True P2P Communication**: Uses WebRTC for direct peer connections
- **End-to-End Encrypted**: Data only flows between peers, never through servers
- **Minimal Signaling**: PeerJS cloud used only for initial peer discovery
- **Usernames**: Set your identity and see who you're chatting with
- **Text Messages**: Real-time text messaging
- **File Transfer**: Send files of any size with progress tracking
- **Chat History**: Local storage keeps your recent conversations
- **Beautiful UI**: Modern dark theme with smooth animations
- **Copy-to-Clipboard**: One-click peer ID sharing

## Local Setup

### Prerequisites
- Node.js 14+ installed
- npm or yarn

### Installation & Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The app will open at `http://localhost:3000`

## How to Use

1. **Share Your ID**: Your peer ID is displayed at the top. Share it with someone
2. **Connect**: Paste their ID and click "Connect"
3. **Chat**: Send text messages and files in real-time
4. **Disconnect**: Click "Disconnect" when done (clears chat history locally)

## Tech Stack

- **Frontend**: Vanilla JavaScript (no frameworks)
- **P2P**: WebRTC via [PeerJS](https://peerjs.com/)
- **Signaling**: PeerJS Cloud (free tier)
- **Storage**: Browser localStorage
- **Styling**: CSS3 with gradients and animations

## Security Notes

✅ **What's Secure:**
- All messages encrypted end-to-end (WebRTC encryption)
- No server stores messages
- No user tracking
- Peer IDs are random and temporary

⚠️ **Limitations:**
- PeerJS cloud sees connection metadata (minimal info)
- If you close the browser, chat history is cleared
- Peer IDs are not human-readable (intentional)

## Troubleshooting

### "Can't connect to peer"
- Verify the peer ID is correct
- Both peers must have the page open
- Check that both are connected to the internet
- Peer might be behind a restrictive firewall

### "Files not transferring"
- Try smaller files first (test with <10MB)
- Keep browser window in focus
- Check browser DevTools console for errors

### "Chat history not saving"
- Check browser localStorage limits
- Try clearing some history with "Clear chat history" button
- Some browsers limit storage to ~5-10MB

## Privacy Policy

This app operates entirely client-side. We do not:
- Track users
- Store messages
- Collect IP addresses
- Use analytics
- Collect any personal data

Visit [PeerJS privacy](https://peerjs.com/) for their signaling service privacy policy.

## License

MIT - Free to use and modify

## Contributing

Pull requests welcome! Feel free to add features like:
- Voice/video calls
- Message search
- User avatars
- Emoji picker
- Dark/light theme toggle

## Support

Found a bug? Have a feature request?
- Check GitHub Issues
- Create a new issue with details

---

**Built with ❤️ for privacy-conscious developers**
