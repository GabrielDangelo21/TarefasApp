from PIL import Image, ImageDraw, ImageFont
import os


def create_icon(size):
    """Create a task app icon"""
    img = Image.new("RGB", (size, size), (11, 16, 32))
    draw = ImageDraw.Draw(img)

    # Draw gradient background (simplified)
    for y in range(size):
        r = int(124 * (1 - y / size) + 35 * (y / size))
        g = int(92 * (1 - y / size) + 192 * (y / size))
        b = int(255 * (1 - y / size) + 255 * (y / size))
        draw.line([(0, y), (size, y)], fill=(r, g, b))

    # Draw card
    margin = int(size * 0.2)
    card_width = int(size * 0.6)
    card_height = int(size * 0.65)
    card_x = (size - card_width) // 2
    card_y = margin
    draw.rounded_rectangle(
        [card_x, card_y, card_x + card_width, card_y + card_height],
        radius=int(size * 0.05),
        fill=(255, 255, 255, 20),
        outline=(255, 255, 255, 50),
        width=2,
    )

    # Draw check items
    item_spacing = int(card_height // 4)
    item_y = card_y + item_spacing

    for i in range(3):
        circle_x = card_x + int(size * 0.08)
        circle_y = item_y + i * item_spacing
        circle_radius = int(size * 0.04)

        # Different colors for different items
        if i == 0:
            color = (45, 212, 191)  # Green (done)
            draw.ellipse(
                [
                    circle_x - circle_radius,
                    circle_y - circle_radius,
                    circle_x + circle_radius,
                    circle_y + circle_radius,
                ],
                fill=color,
            )
            # Draw checkmark
            check_start = (circle_x - circle_radius // 2, circle_y)
            check_mid = (circle_x, circle_y + circle_radius // 2)
            check_end = (circle_x + circle_radius, circle_y - circle_radius // 3)
            draw.line([check_start, check_mid, check_end], fill=(11, 16, 32), width=2)
        elif i == 1:
            color = (251, 191, 36)  # Yellow (done)
            draw.ellipse(
                [
                    circle_x - circle_radius,
                    circle_y - circle_radius,
                    circle_x + circle_radius,
                    circle_y + circle_radius,
                ],
                fill=color,
            )
            # Draw checkmark
            check_start = (circle_x - circle_radius // 2, circle_y)
            check_mid = (circle_x, circle_y + circle_radius // 2)
            check_end = (circle_x + circle_radius, circle_y - circle_radius // 3)
            draw.line([check_start, check_mid, check_end], fill=(11, 16, 32), width=2)
        else:
            color = (255, 255, 255)  # White (pending)
            draw.ellipse(
                [
                    circle_x - circle_radius,
                    circle_y - circle_radius,
                    circle_x + circle_radius,
                    circle_y + circle_radius,
                ],
                outline=(255, 255, 255, 100),
                fill=(255, 255, 255, 30),
                width=2,
            )

        # Draw line
        line_x = circle_x + circle_radius * 2 + 5
        line_y = circle_y - int(circle_radius * 0.6)
        line_width = int(size * 0.25)
        line_height = int(circle_radius * 1.2)
        draw.rounded_rectangle(
            [line_x, line_y, line_x + line_width, line_y + line_height],
            radius=4,
            fill=(255, 255, 255, 80) if i < 2 else (255, 255, 255, 50),
        )

    return img


# Create icons in different sizes
sizes = [180, 192, 512]
for size in sizes:
    icon = create_icon(size)
    filename = f"apple-touch-icon-{size}.png" if size == 180 else f"icon-{size}.png"
    icon.save(filename)
    print(f"Created {filename} ({size}x{size})")

# Also create default icon.png
icon = create_icon(192)
icon.save("icon.png")
print("Created icon.png")
