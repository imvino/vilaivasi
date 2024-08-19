// app/add-product/page.js

'use client'

import React, { useState } from 'react';
import {
    Typography, Grid, Paper, Radio, RadioGroup, FormControlLabel, TextField, Checkbox,
    Button, Switch, Select, MenuItem, InputLabel, FormControl, Box
} from '@mui/material';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';

const AddProductPage = () => {
    const [productType, setProductType] = useState('simple');
    const [inventory, setInventory] = useState(false);

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', p: 3 }}>
            <Box sx={{ maxWidth: 'lg', mx: 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" component="h1">Add product</Typography>
                    <Button color="primary">Learn</Button>
                </Box>

                <Grid container spacing={3}>
                    {/* Left Column */}
                    <Grid item xs={12} lg={8}>
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" color="primary" gutterBottom>PRODUCT TYPE</Typography>
                            <RadioGroup
                                row
                                value={productType}
                                onChange={(e) => setProductType(e.target.value)}
                            >
                                <FormControlLabel value="simple" control={<Radio />} label="Simple product, no variants" />
                                <FormControlLabel value="variants" control={<Radio />} label="Product with variants" />
                                <FormControlLabel value="composite" control={<Radio />} label="Composite product" />
                            </RadioGroup>
                        </Paper>

                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" color="primary" gutterBottom>PRIMARY INFORMATION</Typography>
                            <TextField fullWidth label="Product name" required margin="normal" />
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="SKU" margin="normal" />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Barcode" margin="normal" />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Supplier code" margin="normal" />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Custom field" margin="normal" />
                                </Grid>
                            </Grid>
                            <FormControlLabel
                                control={<Checkbox />}
                                label="Serial number enabled product. Prompt cashier to enter serial number at checkout."
                            />
                            <FormControlLabel
                                control={<Checkbox />}
                                label="Part of a composite product, cannot be sold individually."
                            />
                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={4}
                                margin="normal"
                            />
                        </Paper>

                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" color="primary" gutterBottom>INVENTORY</Typography>
                            <Typography variant="body2" gutterBottom>Track inventory for this product</Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Would you like Hike to track inventory movement for this product?
                            </Typography>
                            <FormControlLabel
                                control={<Switch checked={inventory} onChange={(e) => setInventory(e.target.checked)} />}
                                label={inventory ? "On" : "Off"}
                            />
                        </Paper>

                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" color="primary" gutterBottom>PRICING</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={2.4}>
                                    <TextField fullWidth label="Cost price" type="number" defaultValue="0.00" />
                                </Grid>
                                <Grid item xs={12} sm={6} md={2.4}>
                                    <TextField fullWidth label="Mark-up %" type="number" defaultValue="0.00" />
                                </Grid>
                                <Grid item xs={12} sm={6} md={2.4}>
                                    <TextField fullWidth label="Retail (Ex. Tax)" type="number" defaultValue="0.00" />
                                </Grid>
                                <Grid item xs={12} sm={6} md={2.4}>
                                    <FormControl fullWidth>
                                        <InputLabel>Tax rate</InputLabel>
                                        <Select defaultValue="">
                                            <MenuItem value="">No Tax</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6} md={2.4}>
                                    <TextField fullWidth label="Retail price (Inc. Tax)" type="number" defaultValue="0.00" />
                                </Grid>
                            </Grid>
                        </Paper>

                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" color="primary" gutterBottom>ADDITIONAL UNIT OF MEASURES</Typography>
                            <FormControlLabel
                                control={<Checkbox />}
                                label="Activate additional unit of measures"
                            />
                        </Paper>
                    </Grid>

                    {/* Right Column */}
                    <Grid item xs={12} lg={4}>
                        <Paper sx={{ p: 3, mb: 3, height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <CameraAltOutlinedIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
                        </Paper>

                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" color="primary" gutterBottom>SALES CHANNELS</Typography>
                            <FormControlLabel control={<Checkbox defaultChecked />} label="Point of Sale" />
                            <FormControlLabel control={<Checkbox />} label="Ecommerce" />
                        </Paper>

                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" color="primary" gutterBottom>CATEGORIZE</Typography>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Product types</InputLabel>
                                <Select defaultValue="">
                                    <MenuItem value="">Select or add new type...</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Suppliers</InputLabel>
                                <Select defaultValue="">
                                    <MenuItem value="">Select or add new...</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField fullWidth label="Brand" placeholder="Start typing brand name..." margin="normal" />
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Tags</InputLabel>
                                <Select defaultValue="">
                                    <MenuItem value="">Select or add new...</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField fullWidth label="Season" placeholder="Start typing season..." margin="normal" />
                            <TextField fullWidth label="Additional loyalty points" type="number" defaultValue="0" margin="normal" />
                        </Paper>

                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" color="primary" gutterBottom>OPTIONAL EXTRAS</Typography>
                            <FormControl fullWidth>
                                <InputLabel>Search for Product</InputLabel>
                                <Select defaultValue="">
                                    <MenuItem value="">Search for Product</MenuItem>
                                </Select>
                            </FormControl>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                    <Button variant="outlined" sx={{ mr: 2 }}>CANCEL</Button>
                    <Button variant="contained" color="primary">SAVE</Button>
                </Box>
            </Box>
        </Box>
    );
};

export default AddProductPage;