export function ANWLogoSVG({ size = 42 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="42" height="42" rx="9" fill="#050505"/>
      <path d="M13 7Q12 5 11 8Q9 12 9 17Q7 22 7 27Q6 32 7 36Q8 39 10 41Q13 43 16 44Q19 45 22 44Q25 43 27 41Q29 39 30 36Q31 32 30 28Q29 24 28 22Q27 18 28 15Q29 12 27 10Q25 8 23 8Q21 7 19 7Q16 6 13 7Z" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2"/>
      <circle cx="24" cy="10" r="3.2" fill="#C0292A"/>
      <path d="M24 13.2L22 20" stroke="#C0292A" strokeWidth="2" strokeLinecap="round"/>
      <path d="M24 13.2L26 20" stroke="#C0292A" strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 16.5L19 20" stroke="#C0292A" strokeWidth="2" strokeLinecap="round"/>
      <path d="M26 16.5L29 20" stroke="#C0292A" strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 20L21 25" stroke="#C0292A" strokeWidth="2" strokeLinecap="round"/>
      <path d="M26 20L27 25" stroke="#C0292A" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="30" cy="4.5" r="2.5" fill="white"/>
      <path d="M30 7L28 12" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M30 7L32 12" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M28 9.5L26 12" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M32 9.5L34 12" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M28 12L27 17" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M32 12L33 17" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

export function AfricaMapSVG() {
  return (
    <svg viewBox="0 0 240 265" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
      <path className="africa-path" d="M84 16Q79 12 73 16Q64 20 58 28Q51 38 47 50Q41 64 38 78Q32 94 28 110Q22 128 19 146Q15 164 13 182Q11 198 13 212Q15 226 19 238Q25 252 33 262Q41 272 51 279Q61 286 73 290Q85 294 97 293Q109 292 119 288Q131 284 141 276Q151 268 157 258Q163 248 167 236Q171 222 171 208Q171 192 169 176Q167 160 164 146Q161 132 157 120Q153 106 151 94Q149 80 151 68Q153 56 149 46Q144 36 136 30Q128 24 119 20Q111 16 102 16Q93 14 84 16Z"/>
      <path className="africa-fill" d="M84 16Q79 12 73 16Q64 20 58 28Q51 38 47 50Q41 64 38 78Q32 94 28 110Q22 128 19 146Q15 164 13 182Q11 198 13 212Q15 226 19 238Q25 252 33 262Q41 272 51 279Q61 286 73 290Q85 294 97 293Q109 292 119 288Q131 284 141 276Q151 268 157 258Q163 248 167 236Q171 222 171 208Q171 192 169 176Q167 160 164 146Q161 132 157 120Q153 106 151 94Q149 80 151 68Q153 56 149 46Q144 36 136 30Q128 24 119 20Q111 16 102 16Q93 14 84 16Z"/>
      <g className="fig-red" transform="translate(78,30)">
        <circle cx="28" cy="11" r="8" fill="#C0292A"/>
        <path d="M28 19L22 40" stroke="#C0292A" strokeWidth="4.5" strokeLinecap="round"/>
        <path d="M28 19L34 40" stroke="#C0292A" strokeWidth="4.5" strokeLinecap="round"/>
        <path d="M22 29L15 40" stroke="#C0292A" strokeWidth="4.5" strokeLinecap="round"/>
        <path d="M34 29L41 40" stroke="#C0292A" strokeWidth="4.5" strokeLinecap="round"/>
        <path d="M22 40L19 57" stroke="#C0292A" strokeWidth="4.5" strokeLinecap="round"/>
        <path d="M34 40L37 57" stroke="#C0292A" strokeWidth="4.5" strokeLinecap="round"/>
      </g>
      <g className="fig-white" transform="translate(132,6)">
        <circle cx="21" cy="8" r="5.8" fill="white"/>
        <path d="M21 13.8L18 29" stroke="white" strokeWidth="3.2" strokeLinecap="round"/>
        <path d="M21 13.8L24 29" stroke="white" strokeWidth="3.2" strokeLinecap="round"/>
        <path d="M18 21L12 29" stroke="white" strokeWidth="3.2" strokeLinecap="round"/>
        <path d="M24 21L30 29" stroke="white" strokeWidth="3.2" strokeLinecap="round"/>
        <path d="M18 29L16 41" stroke="white" strokeWidth="3.2" strokeLinecap="round"/>
        <path d="M24 29L26 41" stroke="white" strokeWidth="3.2" strokeLinecap="round"/>
      </g>
    </svg>
  );
}
