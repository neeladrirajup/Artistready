"""Generate baseline sample casting resumes. No browser-local personal data is read."""
import json
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from pypdf import PdfReader

root = Path(__file__).resolve().parents[1]
data = json.loads((root / 'scripts/resume-data.json').read_text(encoding='utf-8'))
output = root / 'public/resumes'
output.mkdir(exist_ok=True)
ink, muted, gold = map(HexColor, ['#20362d', '#64716a', '#bb923c'])
style = ParagraphStyle('body', fontName='Helvetica', fontSize=10, leading=15, textColor=ink)

def paragraph(pdf, text, x, top, width):
    item = Paragraph(text, style)
    _, height = item.wrap(width, 200)
    item.drawOn(pdf, x, top-height)
    return top-height

def label(pdf, text, x, y):
    pdf.setFillColor(gold)
    pdf.setFont('Helvetica-Bold', 9)
    pdf.drawString(x, y, text.upper())

for artist in data['artists']:
    path = output / (artist['id'] + '.pdf')
    pdf = canvas.Canvas(str(path), pagesize=A4)
    width, height = A4
    pdf.setTitle(artist['name'] + ' - Sample casting resume')
    pdf.setAuthor('Artistready - Design preview')
    pdf.setFillColor(HexColor('#fbfaf7'))
    pdf.rect(0, 0, width, height, fill=1, stroke=0)
    pdf.setFillColor(ink)
    pdf.rect(0, height-18, width, 18, fill=1, stroke=0)
    label(pdf, 'ARTISTREADY / SAMPLE CASTING RESUME', 42, height-49)
    pdf.setFillColor(ink)
    pdf.setFont('Times-Bold', 29)
    pdf.drawString(42, height-93, artist['name'])
    pdf.setFont('Helvetica', 12)
    pdf.setFillColor(muted)
    pdf.drawString(43, height-117, artist['role'] + ' | ' + artist['city'] + ', India')
    paragraph(pdf, artist['tagline'], 43, height-143, 330)
    crop = data['artwork'][artist['image']]
    image_x, image_y, image_w, image_h = width-168, height-265, 126, 126
    scale = max(image_w/crop['w'], image_h/crop['h'])
    crop_left = image_x+(image_w-crop['w']*scale)/2
    crop_top = image_y+image_h-(image_h-crop['h']*scale)/2
    pdf.saveState()
    clipping = pdf.beginPath()
    clipping.rect(image_x, image_y, image_w, image_h)
    pdf.clipPath(clipping, stroke=0, fill=0)
    pdf.drawImage(ImageReader(str(root / 'public/references' / (crop['file']+'.png'))), crop_left-crop['x']*scale, crop_top-(1672-crop['y'])*scale, width=941*scale, height=1672*scale)
    pdf.restoreState()
    label(pdf, 'AT A GLANCE', 43, height-223)
    paragraph(pdf, 'Languages: ' + ', '.join(artist['languages']) + '<br/>Experience: ' + str(artist['experience']) + '+ years (sample)<br/>Playing age: ' + str(artist['age']-3) + '-' + str(artist['age']+3) + ' (sample)', 43, height-239, 310)
    y = height-326
    label(pdf, 'SELECTED CREDITS - ILLUSTRATIVE', 43, y)
    y -= 29
    for title, production, director, year in [('Matti Cheruvulu','Riverlight Pictures','Aarav Menon','2024'),('Nila','Northstar Stories','Kavya Rao','2023')]:
        pdf.setFont('Helvetica-Bold', 11)
        pdf.setFillColor(ink)
        pdf.drawString(43, y, title + ' | ' + year)
        paragraph(pdf, artist['role'] + ' | Director: ' + director + '<br/>Production: ' + production + ' | Sample project credit', 43, y-12, 490)
        y -= 62
    label(pdf, 'SKILLS', 43, y-8)
    paragraph(pdf, ', '.join(artist['skills']), 43, y-24, 490)
    label(pdf, 'BOOKING', 43, y-70)
    paragraph(pdf, 'Preferred location: ' + artist['city'] + ', India<br/>Availability, travel, and representation: confirm with the artist.<br/>Booking email has not been supplied.', 43, y-86, 490)
    profile_url = 'https://artist-ready-studio.youngsquid9.chatgpt.site/artists/' + artist['id']
    pdf.setFillColor(ink)
    pdf.setFont('Helvetica-Bold', 10)
    pdf.drawString(43, 115, 'View portfolio and latest sample profile')
    pdf.linkURL(profile_url, (42, 111, 300, 130), relative=0)
    pdf.setStrokeColor(HexColor('#d9ded7'))
    pdf.line(43, 88, width-43, 88)
    pdf.setFillColor(muted)
    pdf.setFont('Helvetica', 8)
    pdf.drawString(43, 69, 'DESIGN PREVIEW - All artist details and credits are illustrative.')
    pdf.drawString(43, 55, 'Baseline sample content only. No device edits, contact data, or private measurements.')
    pdf.save()
    reader = PdfReader(path)
    assert len(reader.pages) == 1 and artist['name'] in reader.pages[0].extract_text()
    print(path.name + ': 1 page, verified')

import pypdfium2 as pdfium
document = pdfium.PdfDocument(str(output / 'ananya-rao.pdf'))
document[0].render(scale=1.5).to_pil().save(root / 'scripts/resume-preview.png')
